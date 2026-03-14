import db from '../db.js';
import type { AsaasWebhookPayload } from './types.js';

/**
 * Verifica a autenticidade do webhook do Asaas.
 * Compara o token enviado no header com o esperado.
 */
export function verifyWebhookSignature(token: string | undefined): boolean {
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expectedToken || !token) return false;
  return token === expectedToken;
}

/**
 * Processa eventos de webhook do Asaas.
 * Atualiza o status das doações no banco de dados.
 */
export function processWebhookEvent(payload: AsaasWebhookPayload): { processed: boolean; message: string } {
  const { event, payment } = payload;

  if (!payment?.id) {
    return { processed: false, message: 'Payload inválido: payment.id ausente' };
  }

  const donation = db.prepare(
    'SELECT id, status FROM donations WHERE external_id = ?'
  ).get(payment.id) as { id: number; status: string } | undefined;

  if (!donation) {
    console.log(`[Webhook] Doação não encontrada para payment ${payment.id}, ignorando.`);
    return { processed: false, message: `Doação com external_id ${payment.id} não encontrada` };
  }

  switch (event) {
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_CONFIRMED': {
      if (donation.status === 'confirmed') {
        return { processed: true, message: 'Doação já confirmada anteriormente' };
      }

      db.prepare(
        `UPDATE donations SET status = 'confirmed', confirmed_at = datetime('now'),
         metadata = json_set(COALESCE(metadata, '{}'), '$.asaasEvent', ?)
         WHERE external_id = ?`
      ).run(event, payment.id);

      console.log(`[Webhook] ✅ Doação #${donation.id} confirmada (${event})`);
      return { processed: true, message: `Doação #${donation.id} confirmada com sucesso` };
    }

    case 'PAYMENT_REFUNDED':
    case 'PAYMENT_REFUND_IN_PROGRESS': {
      db.prepare(
        `UPDATE donations SET status = 'refunded', 
         metadata = json_set(COALESCE(metadata, '{}'), '$.asaasEvent', ?)
         WHERE external_id = ?`
      ).run(event, payment.id);

      console.log(`[Webhook] ↩️ Doação #${donation.id} estornada (${event})`);
      return { processed: true, message: `Doação #${donation.id} marcada como estornada` };
    }

    case 'PAYMENT_OVERDUE':
    case 'PAYMENT_DELETED': {
      db.prepare(
        `UPDATE donations SET status = 'failed',
         metadata = json_set(COALESCE(metadata, '{}'), '$.asaasEvent', ?)
         WHERE external_id = ?`
      ).run(event, payment.id);

      console.log(`[Webhook] ❌ Doação #${donation.id} falhou (${event})`);
      return { processed: true, message: `Doação #${donation.id} marcada como falha` };
    }

    default: {
      console.log(`[Webhook] Evento ${event} não processado para doação #${donation.id}`);
      return { processed: false, message: `Evento ${event} não requer processamento` };
    }
  }
}
