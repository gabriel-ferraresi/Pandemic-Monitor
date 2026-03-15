import type { AsaasCustomer, AsaasPayment, AsaasPixQrCode } from './types.js';

// ====== ASAAS API CLIENT — Engenharia de Elite ======

// IMPORTANTE: Usar getters (lazy evaluation) porque os imports ESM executam
// ANTES do dotenv.config() no index.ts. Constantes no nível do módulo
// seriam avaliadas com process.env vazio.
function getBaseUrl(): string {
  return process.env.ASAAS_ENVIRONMENT === 'sandbox'
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/api/v3';
}

function getApiKey(): string {
  return process.env.ASAAS_API_KEY || '';
}

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1_000;

/**
 * Realiza requisição autenticada à API do Asaas com retry e timeout.
 */
async function asaasRequest<T>(
  path: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'access_token': getApiKey(),
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[Asaas] Erro HTTP ${response.status} (tentativa ${attempt}/${retries}):`, errorBody);

        // Não retry em erros 4xx (exceto 429 rate limit)
        if (response.status < 500 && response.status !== 429) {
          throw new Error(`Asaas API error ${response.status}: ${errorBody}`);
        }

        if (attempt === retries) {
          throw new Error(`Asaas API error ${response.status} após ${retries} tentativas: ${errorBody}`);
        }
      } else {
        return await response.json() as T;
      }
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        console.error(`[Asaas] Timeout na tentativa ${attempt}/${retries}`);
      } else if (attempt === retries) {
        throw err;
      }
    }

    // Backoff exponencial
    const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  throw new Error('[Asaas] Falha em todas as tentativas de requisição');
}

/**
 * Cria ou recupera um customer no Asaas.
 * O Asaas previne duplicatas por CPF/CNPJ automaticamente.
 */
export async function createOrGetCustomer(
  name: string,
  cpfCnpj: string,
  email?: string
): Promise<AsaasCustomer> {
  // Primeiro, buscar se já existe
  const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');

  try {
    const search = await asaasRequest<{ data: AsaasCustomer[] }>(
      `/customers?cpfCnpj=${cleanCpfCnpj}`,
      { method: 'GET' }
    );

    if (search.data && search.data.length > 0) {
      return search.data[0];
    }
  } catch {
    // Se falhar a busca, tenta criar
  }

  return asaasRequest<AsaasCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name,
      cpfCnpj: cleanCpfCnpj,
      email: email || undefined,
      notificationDisabled: true,
    }),
  });
}

/**
 * Cria cobrança PIX no Asaas.
 * Retorna o QR code e o payload copia-cola.
 */
export async function createPixCharge(
  customerId: string,
  amount: number,
  description: string
): Promise<{ payment: AsaasPayment; qrCode: AsaasPixQrCode }> {
  // 1. Criar a cobrança
  const payment = await asaasRequest<AsaasPayment>('/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: customerId,
      billingType: 'PIX',
      value: amount,
      description,
      dueDate: new Date(Date.now() + 30 * 60 * 1000).toISOString().split('T')[0], // +30min
    }),
  });

  // 2. Gerar QR Code PIX
  const qrCode = await asaasRequest<AsaasPixQrCode>(
    `/payments/${payment.id}/pixQrCode`,
    { method: 'GET' }
  );

  return { payment, qrCode };
}

/**
 * Cria cobrança com cartão tokenizado no Asaas.
 */
export async function createCardCharge(
  customerId: string,
  amount: number,
  cardToken: string,
  holderName: string,
  description: string
): Promise<AsaasPayment> {
  return asaasRequest<AsaasPayment>('/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: customerId,
      billingType: 'CREDIT_CARD',
      value: amount,
      description,
      dueDate: new Date().toISOString().split('T')[0],
      creditCardToken: cardToken,
      creditCardHolderInfo: {
        name: holderName,
      },
    }),
  });
}

/**
 * Consulta status de um pagamento no Asaas.
 */
export async function getPaymentStatus(paymentId: string): Promise<AsaasPayment> {
  return asaasRequest<AsaasPayment>(`/payments/${paymentId}`, { method: 'GET' });
}
