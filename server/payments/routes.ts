import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import db from '../db.js';
import { createOrGetCustomer, createPixCharge, createCardCharge, getPaymentStatus } from './asaas-client.js';
import { verifyWebhookSignature, processWebhookEvent } from './webhooks.js';
import type {
  CreatePixDonationRequest,
  CreateCardDonationRequest,
  CreateCryptoDonationRequest,
  DonationRow,
  DonationWallItem,
  DonationStats,
  CryptoCurrency,
} from './types.js';

const router = Router();

// ─── Rate Limiter mais restritivo para rotas de pagamento ───
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 requisições por minuto por IP
  message: { error: 'Limite de requisições de pagamento excedido. Aguarde um momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiter a todas as rotas (exceto webhook)
router.use((req, _res, next) => {
  if (req.path === '/webhook') return next();
  return paymentLimiter(req, _res, next);
});

// ─── Validação helpers ───
function validateAmount(amount: unknown): number | null {
  const num = Number(amount);
  if (isNaN(num) || num < 5 || num > 50000) return null;
  return Math.round(num * 100) / 100; // 2 casas decimais
}

function sanitizeString(str: unknown, maxLength = 100): string | null {
  if (typeof str !== 'string') return null;
  return str.trim().substring(0, maxLength).replace(/[<>]/g, '') || null;
}

const VALID_CRYPTO: CryptoCurrency[] = ['BTC', 'ETH', 'SOL', 'ZEC'];

// IMPORTANTE: Getter (lazy) para garantir leitura após dotenv.config()
function getCryptoAddresses(): Record<CryptoCurrency, string> {
  return {
    BTC: process.env.CRYPTO_BTC_ADDRESS || '',
    ETH: process.env.CRYPTO_ETH_ADDRESS || '',
    SOL: process.env.CRYPTO_SOL_ADDRESS || '',
    ZEC: process.env.CRYPTO_ZEC_ADDRESS || '',
  };
}

const CRYPTO_EXPLORERS: Record<CryptoCurrency, string> = {
  BTC: 'https://mempool.space/address/',
  ETH: 'https://etherscan.io/address/',
  SOL: 'https://solscan.io/account/',
  ZEC: 'https://blockchair.com/zcash/address/',
};

// ═══════════════════════════════════════════
// POST /api/donations/pix — Criar cobrança PIX
// ═══════════════════════════════════════════
router.post('/pix', async (req, res) => {
  try {
    const body = req.body as CreatePixDonationRequest;
    const amount = validateAmount(body.amount);
    if (!amount) {
      return res.status(400).json({ error: 'Valor inválido. Mínimo: R$ 5,00, Máximo: R$ 50.000,00' });
    }

    // CPF/CNPJ é obrigatório pelo Asaas (compliance)
    const cpfCnpj = typeof body.cpfCnpj === 'string' ? body.cpfCnpj.replace(/\D/g, '') : '';
    if (!cpfCnpj || (cpfCnpj.length !== 11 && cpfCnpj.length !== 14)) {
      return res.status(400).json({ error: 'CPF ou CNPJ válido é obrigatório para gerar cobrança PIX.' });
    }

    const donorName = sanitizeString(body.donorName, 60);
    const donorMessage = sanitizeString(body.donorMessage, 200);
    const isAnonymous = body.isAnonymous !== false ? 1 : 0;

    // Criar customer no Asaas — CPF é obrigatório por compliance financeiro
    const customer = await createOrGetCustomer(
      donorName || 'Apoiador Pandemic Monitor',
      cpfCnpj,
    );

    // Criar cobrança PIX
    const { payment, qrCode } = await createPixCharge(
      customer.id,
      amount,
      `Doação Pandemic Monitor - R$ ${amount.toFixed(2)}`
    );

    // Salvar no banco
    const stmt = db.prepare(
      `INSERT INTO donations (external_id, method, amount_brl, donor_name, donor_message, status, is_anonymous)
       VALUES (?, 'pix', ?, ?, ?, 'pending', ?)`
    );
    const result = stmt.run(payment.id, amount, donorName, donorMessage, isAnonymous);

    res.json({
      donationId: result.lastInsertRowid,
      externalId: payment.id,
      qrCodeBase64: qrCode.encodedImage,
      qrCodePayload: qrCode.payload,
      expiresAt: qrCode.expirationDate,
    });
  } catch (err: any) {
    console.error('[Donations] Erro ao criar PIX:', err.message);
    res.status(500).json({ error: 'Falha ao gerar cobrança PIX. Tente novamente.' });
  }
});

// ═══════════════════════════════════════════
// POST /api/donations/card — Pagamento com cartão tokenizado
// ═══════════════════════════════════════════
router.post('/card', async (req, res) => {
  try {
    const body = req.body as CreateCardDonationRequest;
    const amount = validateAmount(body.amount);
    if (!amount) {
      return res.status(400).json({ error: 'Valor inválido. Mínimo: R$ 5,00, Máximo: R$ 50.000,00' });
    }

    if (!body.cardToken || typeof body.cardToken !== 'string') {
      return res.status(400).json({ error: 'Token do cartão é obrigatório.' });
    }

    if (!body.customer?.name || !body.customer?.cpfCnpj) {
      return res.status(400).json({ error: 'Nome e CPF/CNPJ do titular são obrigatórios.' });
    }

    const donorName = sanitizeString(body.donorName, 60);
    const donorMessage = sanitizeString(body.donorMessage, 200);
    const isAnonymous = body.isAnonymous !== false ? 1 : 0;

    // Criar ou recuperar customer
    const customer = await createOrGetCustomer(
      body.customer.name,
      body.customer.cpfCnpj,
      body.customer.email
    );

    // Criar cobrança com cartão tokenizado
    const payment = await createCardCharge(
      customer.id,
      amount,
      body.cardToken,
      body.customer.name,
      `Doação Pandemic Monitor - R$ ${amount.toFixed(2)}`
    );

    const status = payment.status === 'CONFIRMED' || payment.status === 'RECEIVED' ? 'confirmed' : 'failed';

    // Salvar no banco
    const stmt = db.prepare(
      `INSERT INTO donations (external_id, method, amount_brl, donor_name, donor_message, status, is_anonymous, confirmed_at)
       VALUES (?, 'card', ?, ?, ?, ?, ?, ${status === 'confirmed' ? "datetime('now')" : 'NULL'})`
    );
    const result = stmt.run(payment.id, amount, donorName, donorMessage, status, isAnonymous);

    res.json({
      donationId: result.lastInsertRowid,
      externalId: payment.id,
      status,
      failReason: status === 'failed' ? 'Pagamento não aprovado pela operadora.' : undefined,
    });
  } catch (err: any) {
    console.error('[Donations] Erro ao processar cartão:', err.message);
    res.status(500).json({ error: 'Falha ao processar pagamento com cartão. Tente novamente.' });
  }
});

// ═══════════════════════════════════════════
// POST /api/donations/crypto — Registrar intenção de doação crypto
// ═══════════════════════════════════════════
router.post('/crypto', async (req, res) => {
  try {
    const body = req.body as CreateCryptoDonationRequest;

    if (!body.currency || !VALID_CRYPTO.includes(body.currency)) {
      return res.status(400).json({ error: `Criptomoeda inválida. Aceitas: ${VALID_CRYPTO.join(', ')}` });
    }

    const donorName = sanitizeString(body.donorName, 60);
    const donorMessage = sanitizeString(body.donorMessage, 200);
    const txHash = sanitizeString(body.txHash, 128);
    const isAnonymous = body.isAnonymous !== false ? 1 : 0;

    const stmt = db.prepare(
      `INSERT INTO donations (method, amount_brl, crypto_currency, crypto_tx_hash, donor_name, donor_message, status, is_anonymous)
       VALUES ('crypto', 0, ?, ?, ?, ?, ?, ?)`
    );
    const status = txHash ? 'pending' : 'pending';
    const result = stmt.run(body.currency, txHash, donorName, donorMessage, status, isAnonymous);

    res.json({
      donationId: result.lastInsertRowid,
      currency: body.currency,
      address: getCryptoAddresses()[body.currency],
      explorerUrl: CRYPTO_EXPLORERS[body.currency] + getCryptoAddresses()[body.currency],
    });
  } catch (err: any) {
    console.error('[Donations] Erro ao registrar crypto:', err.message);
    res.status(500).json({ error: 'Falha ao registrar doação crypto.' });
  }
});

// ═══════════════════════════════════════════
// GET /api/donations/crypto-addresses — Endereços públicos
// ═══════════════════════════════════════════
router.get('/crypto-addresses', (_req, res) => {
  const addresses = VALID_CRYPTO.map(currency => ({
    currency,
    address: getCryptoAddresses()[currency],
    explorerUrl: CRYPTO_EXPLORERS[currency] + getCryptoAddresses()[currency],
  })).filter(a => a.address); // Só retorna se o endereço estiver configurado

  res.json({ addresses });
});

// ═══════════════════════════════════════════
// GET /api/donations/status/:id — Status de um pagamento
// ═══════════════════════════════════════════
router.get('/status/:id', async (req, res) => {
  try {
    const donationId = parseInt(req.params.id, 10);
    if (isNaN(donationId)) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    const donation = db.prepare(
      'SELECT id, method, status, created_at, confirmed_at FROM donations WHERE id = ?'
    ).get(donationId) as Pick<DonationRow, 'id' | 'method' | 'status' | 'created_at' | 'confirmed_at'> | undefined;

    if (!donation) {
      return res.status(404).json({ error: 'Doação não encontrada.' });
    }

    // Se pendente e tem external_id, verificar no Asaas
    if (donation.status === 'pending' && donation.method !== 'crypto') {
      const row = db.prepare('SELECT external_id FROM donations WHERE id = ?').get(donationId) as { external_id: string } | undefined;
      if (row?.external_id) {
        try {
          const asaasPayment = await getPaymentStatus(row.external_id);
          if (asaasPayment.status === 'CONFIRMED' || asaasPayment.status === 'RECEIVED') {
            db.prepare(
              `UPDATE donations SET status = 'confirmed', confirmed_at = datetime('now') WHERE id = ?`
            ).run(donationId);
            donation.status = 'confirmed';
          }
        } catch {
          // Silencioso — o webhook atualizará eventualmente
        }
      }
    }

    res.json(donation);
  } catch (err: any) {
    console.error('[Donations] Erro ao consultar status:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ═══════════════════════════════════════════
// GET /api/donations/wall — Mural de apoiadores
// ═══════════════════════════════════════════
router.get('/wall', (_req, res) => {
  try {
    // Top 11 doadores dos últimos 7 dias (por valor total)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const topDonors = db.prepare(`
      SELECT 
        donor_name,
        method,
        crypto_currency,
        MAX(created_at) as created_at,
        SUM(amount_brl) as total_donated
      FROM donations 
      WHERE status = 'confirmed' 
        AND is_anonymous = 0 
        AND donor_name IS NOT NULL
        AND created_at >= ?
      GROUP BY donor_name
      ORDER BY total_donated DESC
      LIMIT 11
    `).all(sevenDaysAgo) as Array<{
      donor_name: string;
      method: string;
      crypto_currency: string | null;
      created_at: string;
      total_donated: number;
    }>;

    // Mural geral — até 218 resultados (incluindo anônimos)
    const wallDonations = db.prepare(`
      SELECT 
        id,
        CASE WHEN is_anonymous = 1 THEN 'Apoiador Anônimo' ELSE COALESCE(donor_name, 'Apoiador Anônimo') END as donor_name,
        method,
        crypto_currency,
        created_at
      FROM donations 
      WHERE status = 'confirmed'
      ORDER BY created_at DESC
      LIMIT 218
    `).all() as Array<{
      id: number;
      donor_name: string;
      method: string;
      crypto_currency: string | null;
      created_at: string;
    }>;

    // Montar top 11 com ranking
    const topDonorNames = new Set(topDonors.map(d => d.donor_name));
    const top11: DonationWallItem[] = topDonors.map((d, index) => ({
      id: index + 1,
      donorName: d.donor_name,
      method: d.method as any,
      cryptoCurrency: d.crypto_currency as CryptoCurrency | undefined,
      createdAt: d.created_at,
      isTopDonor: true,
      rank: index + 1,
    }));

    // Mural sem duplicar os top 11
    const wall: DonationWallItem[] = wallDonations.map(d => ({
      id: d.id,
      donorName: d.donor_name,
      method: d.method as any,
      cryptoCurrency: d.crypto_currency as CryptoCurrency | undefined,
      createdAt: d.created_at,
      isTopDonor: topDonorNames.has(d.donor_name),
    }));

    res.json({ top11, wall });
  } catch (err: any) {
    console.error('[Donations] Erro ao buscar mural:', err.message);
    res.status(500).json({ error: 'Erro ao carregar mural de apoiadores.' });
  }
});

// ═══════════════════════════════════════════
// GET /api/donations/stats — Estatísticas públicas
// ═══════════════════════════════════════════
router.get('/stats', (_req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(DISTINCT COALESCE(donor_name, 'anon_' || id)) as total_donors,
        COUNT(*) as total_donations,
        SUM(CASE WHEN method = 'pix' THEN 1 ELSE 0 END) as pix_count,
        SUM(CASE WHEN method = 'card' THEN 1 ELSE 0 END) as card_count,
        SUM(CASE WHEN method = 'crypto' THEN 1 ELSE 0 END) as crypto_count
      FROM donations 
      WHERE status = 'confirmed'
    `).get() as any;

    const response: DonationStats = {
      totalDonors: stats.total_donors || 0,
      totalDonations: stats.total_donations || 0,
      methodBreakdown: {
        pix: stats.pix_count || 0,
        card: stats.card_count || 0,
        crypto: stats.crypto_count || 0,
      },
    };

    res.json(response);
  } catch (err: any) {
    console.error('[Donations] Erro ao buscar stats:', err.message);
    res.status(500).json({ error: 'Erro ao carregar estatísticas.' });
  }
});

// ═══════════════════════════════════════════
// POST /api/donations/webhook — Webhook Asaas
// ═══════════════════════════════════════════
router.post('/webhook', (req, res) => {
  try {
    // Verificar autenticidade
    const token = req.headers['asaas-access-token'] as string | undefined;
    if (!verifyWebhookSignature(token)) {
      console.warn('[Webhook] ⚠️ Token inválido rejeitado');
      return res.status(401).json({ error: 'Não autorizado.' });
    }

    const result = processWebhookEvent(req.body);
    res.json(result);
  } catch (err: any) {
    console.error('[Webhook] Erro crítico:', err.message);
    res.status(500).json({ error: 'Erro ao processar webhook.' });
  }
});

export default router;
