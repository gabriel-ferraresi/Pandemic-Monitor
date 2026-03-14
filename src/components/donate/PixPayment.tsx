import { useState, useEffect, useCallback } from "react";
import { Copy, Check, Clock, Loader2, QrCode } from "lucide-react";
import { cn } from "../../utils";

interface PixPaymentProps {
  amount: number;
  donorName?: string;
  donorMessage?: string;
  isAnonymous: boolean;
  onSuccess: () => void;
  onError: (message: string) => void;
  isMobile?: boolean;
}

interface PixData {
  donationId: number;
  externalId: string;
  qrCodeBase64: string;
  qrCodePayload: string;
  expiresAt: string;
}

export function PixPayment({ amount, donorName, donorMessage, isAnonymous, onSuccess, onError, isMobile }: PixPaymentProps) {
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [polling, setPolling] = useState(false);

  // Gerar cobrança PIX
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/donations/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, donorName, donorMessage, isAnonymous }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Falha ao gerar PIX');
        }

        const data = await res.json();
        setPixData(data);
        setPolling(true);
      } catch (err: any) {
        onError(err.message || 'Erro ao gerar cobrança PIX');
      } finally {
        setLoading(false);
      }
    })();
  }, [amount]);

  // Timer de expiração
  useEffect(() => {
    if (!pixData?.expiresAt) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const expires = new Date(pixData.expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft('Expirado');
        clearInterval(timer);
        setPolling(false);
        return;
      }

      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [pixData?.expiresAt]);

  // Polling para verificar pagamento confirmado
  useEffect(() => {
    if (!polling || !pixData?.donationId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/donations/status/${pixData.donationId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'confirmed') {
            setPolling(false);
            onSuccess();
          }
        }
      } catch {
        // Silencioso — continua polling
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [polling, pixData?.donationId, onSuccess]);

  // Copiar copia-cola
  const handleCopy = useCallback(async () => {
    if (!pixData?.qrCodePayload) return;
    try {
      await navigator.clipboard.writeText(pixData.qrCodePayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = pixData.qrCodePayload;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }, [pixData?.qrCodePayload]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-zinc-500 font-mono">Gerando QR Code PIX...</p>
      </div>
    );
  }

  if (!pixData) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-500 font-mono">Falha ao gerar cobrança PIX. Tente novamente.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR Code */}
      <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-200 dark:border-white/20">
        {pixData.qrCodeBase64 ? (
          <img
            src={`data:image/png;base64,${pixData.qrCodeBase64}`}
            alt="QR Code PIX"
            className={cn("rounded-lg", isMobile ? "w-48 h-48" : "w-56 h-56")}
          />
        ) : (
          <div className={cn("flex items-center justify-center bg-slate-100 rounded-lg", isMobile ? "w-48 h-48" : "w-56 h-56")}>
            <QrCode className="w-16 h-16 text-slate-400" />
          </div>
        )}
      </div>

      {/* Timer */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-zinc-500">
        <Clock className="w-3.5 h-3.5" />
        <span>Expira em {timeLeft || '--:--'}</span>
      </div>

      {/* Valor */}
      <div className="text-center">
        <div className="text-2xl font-bold text-slate-800 dark:text-white">
          R$ {amount.toFixed(2)}
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-500 font-mono mt-1">
          Escaneie o QR Code no seu app bancário
        </p>
      </div>

      {/* Botão copia-cola */}
      <button
        onClick={handleCopy}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all border",
          copied
            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500"
            : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:border-emerald-500/30"
        )}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Código copiado!' : 'Copiar código PIX'}
      </button>

      {/* Status polling */}
      {polling && (
        <div className="flex items-center gap-2 text-xs text-emerald-500 font-mono animate-pulse">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Aguardando confirmação do pagamento...
        </div>
      )}
    </div>
  );
}
