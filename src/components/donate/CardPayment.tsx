import { useState } from "react";
import { CreditCard, Loader2, AlertCircle } from "lucide-react";
import { cn } from "../../utils";

interface CardPaymentProps {
  amount: number;
  donorName?: string;
  donorMessage?: string;
  isAnonymous: boolean;
  onSuccess: () => void;
  onError: (message: string) => void;
  isMobile?: boolean;
}

// Detectar bandeira pelo início do número
function detectBrand(number: string): string {
  const n = number.replace(/\D/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'Mastercard';
  if (/^636368|636369|438935|504175|451416|636297|5067|4576|4011/.test(n)) return 'Elo';
  if (/^3[47]/.test(n)) return 'Amex';
  return '';
}

// Máscara de cartão
function maskCardNumber(value: string): string {
  return value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').substring(0, 19);
}

function maskExpiry(value: string): string {
  return value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/, '$1/').substring(0, 5);
}

function maskCpf(value: string): string {
  return value.replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .substring(0, 14);
}

export function CardPayment({ amount, donorName, donorMessage, isAnonymous, onSuccess, onError, isMobile }: CardPaymentProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const brand = detectBrand(cardNumber);
  const isFormValid = cardNumber.replace(/\D/g, '').length >= 13 &&
    cardName.trim().length >= 3 &&
    expiry.length === 5 &&
    cvv.length >= 3 &&
    cpf.replace(/\D/g, '').length >= 11;

  const handleSubmit = async () => {
    if (!isFormValid || processing) return;

    setProcessing(true);
    setErrorMsg('');

    try {
      // Enviar dados para o backend (em produção, usar SDK Asaas para tokenização no frontend)
      const res = await fetch('/api/donations/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          cardToken: cardNumber.replace(/\D/g, ''), // Em produção: token do Asaas SDK
          donorName,
          donorMessage,
          isAnonymous,
          customer: {
            name: cardName,
            cpfCnpj: cpf.replace(/\D/g, ''),
            email: email || undefined,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha no pagamento');
      }

      if (data.status === 'confirmed') {
        onSuccess();
      } else {
        setErrorMsg(data.failReason || 'Pagamento não aprovado. Verifique os dados do cartão.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar pagamento');
      onError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-white/5 text-slate-800 dark:text-white text-sm font-mono outline-none transition-all border-slate-200 dark:border-white/10 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 placeholder:text-slate-400 dark:placeholder:text-zinc-600";

  return (
    <div className="space-y-3">
      {/* Valor */}
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-slate-800 dark:text-white">
          R$ {amount.toFixed(2)}
        </div>
      </div>

      {/* Número do cartão */}
      <div className="relative">
        <input
          type="text"
          placeholder="Número do cartão"
          value={cardNumber}
          onChange={(e) => setCardNumber(maskCardNumber(e.target.value))}
          className={inputClass}
          maxLength={19}
        />
        {brand && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-500 font-mono uppercase">
            {brand}
          </span>
        )}
      </div>

      {/* Nome no cartão */}
      <input
        type="text"
        placeholder="Nome impresso no cartão"
        value={cardName}
        onChange={(e) => setCardName(e.target.value.toUpperCase())}
        className={inputClass}
      />

      {/* Validade + CVV */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="MM/AA"
          value={expiry}
          onChange={(e) => setExpiry(maskExpiry(e.target.value))}
          className={inputClass}
          maxLength={5}
        />
        <input
          type="text"
          placeholder="CVV"
          value={cvv}
          onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
          className={inputClass}
          maxLength={4}
        />
      </div>

      {/* CPF */}
      <input
        type="text"
        placeholder="CPF do titular"
        value={cpf}
        onChange={(e) => setCpf(maskCpf(e.target.value))}
        className={inputClass}
        maxLength={14}
      />

      {/* Email (opcional) */}
      <input
        type="email"
        placeholder="E-mail (opcional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputClass}
      />

      {/* Erro */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-500 font-mono">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Botão de pagamento */}
      <button
        onClick={handleSubmit}
        disabled={!isFormValid || processing}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
          isFormValid && !processing
            ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
            : "bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-zinc-600 cursor-not-allowed"
        )}
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Pagar R$ {amount.toFixed(2)}
          </>
        )}
      </button>

      {/* Info segurança */}
      <p className="text-[10px] text-center text-slate-400 dark:text-zinc-600 font-mono">
        🔒 Seus dados são criptografados e processados com segurança via Asaas.
      </p>
    </div>
  );
}
