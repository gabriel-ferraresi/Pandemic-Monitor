// ====== TYPES — Módulo de Pagamentos ======

export type PaymentMethod = 'pix' | 'card' | 'crypto';
export type CryptoCurrency = 'BTC' | 'ETH' | 'SOL' | 'ZEC';
export type DonationStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';

export interface CreatePixDonationRequest {
  amount: number; // BRL, min 5.00
  cpfCnpj: string; // CPF ou CNPJ — obrigatório pelo Asaas (compliance)
  donorName?: string;
  donorMessage?: string;
  isAnonymous?: boolean;
}

export interface CreateCardDonationRequest {
  amount: number;
  cardToken: string; // Tokenizado no frontend via Asaas SDK
  donorName?: string;
  donorMessage?: string;
  isAnonymous?: boolean;
  customer: {
    name: string;
    cpfCnpj: string;
    email?: string;
  };
}

export interface CreateCryptoDonationRequest {
  currency: CryptoCurrency;
  donorName?: string;
  donorMessage?: string;
  isAnonymous?: boolean;
  txHash?: string;
}

export interface PixChargeResponse {
  donationId: number;
  externalId: string;
  qrCodeBase64: string;
  qrCodePayload: string; // Copia-cola
  expiresAt: string;
}

export interface CardChargeResponse {
  donationId: number;
  externalId: string;
  status: 'confirmed' | 'failed';
  failReason?: string;
}

export interface CryptoDonationResponse {
  donationId: number;
  currency: CryptoCurrency;
  address: string;
}

export interface DonationWallItem {
  id: number;
  donorName: string;
  method: PaymentMethod;
  cryptoCurrency?: CryptoCurrency;
  createdAt: string;
  isTopDonor: boolean;
  rank?: number;
}

export interface DonationStats {
  totalDonors: number;
  totalDonations: number;
  methodBreakdown: Record<PaymentMethod, number>;
}

// Asaas API Types
export interface AsaasCustomer {
  id: string;
  name: string;
  cpfCnpj: string;
  email?: string;
}

export interface AsaasPayment {
  id: string;
  status: string;
  value: number;
  billingType: string;
  invoiceUrl?: string;
}

export interface AsaasPixQrCode {
  encodedImage: string; // Base64
  payload: string;      // Copia-cola
  expirationDate: string;
}

export interface AsaasWebhookPayload {
  event: string;
  payment: {
    id: string;
    status: string;
    value: number;
    billingType: string;
    customer: string;
    paymentDate?: string;
  };
}

export interface DonationRow {
  id: number;
  external_id: string | null;
  method: PaymentMethod;
  amount_brl: number;
  amount_crypto: number | null;
  crypto_currency: CryptoCurrency | null;
  crypto_tx_hash: string | null;
  donor_name: string | null;
  donor_message: string | null;
  status: DonationStatus;
  is_anonymous: number;
  created_at: string;
  confirmed_at: string | null;
  metadata: string | null;
}
