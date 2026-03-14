import { useState, useEffect, useCallback } from "react";
import { Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "../../utils";

type CryptoCurrency = 'BTC' | 'ETH' | 'SOL' | 'ZEC';

interface CryptoAddress {
  currency: CryptoCurrency;
  address: string;
  explorerUrl: string;
}

const CRYPTO_INFO: Record<CryptoCurrency, { name: string; color: string; icon: string }> = {
  BTC: { name: 'Bitcoin', color: 'text-orange-500', icon: '₿' },
  ETH: { name: 'Ethereum', color: 'text-blue-400', icon: 'Ξ' },
  SOL: { name: 'Solana', color: 'text-purple-500', icon: '◎' },
  ZEC: { name: 'Zcash', color: 'text-yellow-500', icon: 'ⓩ' },
};

interface CryptoPaymentProps {
  donorName?: string;
  donorMessage?: string;
  isAnonymous: boolean;
  onSuccess: () => void;
  isMobile?: boolean;
}

export function CryptoPayment({ donorName, donorMessage, isAnonymous, onSuccess, isMobile }: CryptoPaymentProps) {
  const [addresses, setAddresses] = useState<CryptoAddress[]>([]);
  const [selected, setSelected] = useState<CryptoCurrency>('BTC');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [txHash, setTxHash] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Buscar endereços do backend
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/donations/crypto-addresses');
        if (res.ok) {
          const data = await res.json();
          setAddresses(data.addresses);
          if (data.addresses.length > 0) {
            setSelected(data.addresses[0].currency);
          }
        }
      } catch {
        // Fallback silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentAddress = addresses.find(a => a.currency === selected);
  const info = CRYPTO_INFO[selected];

  const handleCopy = useCallback(async () => {
    if (!currentAddress?.address) return;
    try {
      await navigator.clipboard.writeText(currentAddress.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = currentAddress.address;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }, [currentAddress?.address]);

  const handleSubmitTx = async () => {
    if (!txHash.trim()) return;
    try {
      const res = await fetch('/api/donations/crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: selected,
          donorName,
          donorMessage,
          isAnonymous,
          txHash: txHash.trim(),
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => onSuccess(), 1500);
      }
    } catch {
      // Silencioso
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-zinc-500 font-mono">Carregando endereços...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs de moedas */}
      <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-xl">
        {addresses.map((addr) => {
          const cryptoInfo = CRYPTO_INFO[addr.currency];
          const isActive = selected === addr.currency;
          return (
            <button
              key={addr.currency}
              onClick={() => { setSelected(addr.currency); setCopied(false); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all",
                isActive
                  ? "bg-white dark:bg-white/10 shadow-sm text-slate-800 dark:text-white"
                  : "text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300"
              )}
            >
              <span className={cn("text-sm", cryptoInfo.color)}>{cryptoInfo.icon}</span>
              {addr.currency}
            </button>
          );
        })}
      </div>

      {/* Info da moeda */}
      {currentAddress && (
        <div className="flex flex-col items-center gap-4">
          {/* Ícone grande */}
          <div className={cn("text-4xl", info.color)}>{info.icon}</div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">{info.name}</h3>

          {/* Endereço */}
          <div className="w-full p-3 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
            <p className={cn(
              "font-mono text-center break-all text-slate-700 dark:text-zinc-300",
              isMobile ? "text-[10px]" : "text-xs"
            )}>
              {currentAddress.address}
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-2 w-full">
            <button
              onClick={handleCopy}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all border",
                copied
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500"
                  : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:border-emerald-500/30"
              )}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
            <a
              href={currentAddress.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:border-emerald-500/30"
            >
              <ExternalLink className="w-4 h-4" />
              Explorer
            </a>
          </div>

          {/* Informar TX hash */}
          <div className="w-full space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-500">
              Informar hash da transação (opcional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="0x... ou hash da transação"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                disabled={submitted}
                className="flex-1 px-3 py-2.5 rounded-xl border bg-white dark:bg-white/5 text-slate-800 dark:text-white text-xs font-mono outline-none transition-all border-slate-200 dark:border-white/10 focus:border-emerald-500/50 placeholder:text-slate-400 dark:placeholder:text-zinc-600"
              />
              <button
                onClick={handleSubmitTx}
                disabled={!txHash.trim() || submitted}
                className={cn(
                  "px-4 py-2.5 rounded-xl font-bold text-xs transition-all",
                  txHash.trim() && !submitted
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-zinc-600 cursor-not-allowed"
                )}
              >
                {submitted ? '✓' : 'Enviar'}
              </button>
            </div>
            {submitted && (
              <p className="text-xs text-emerald-500 font-mono">✓ Transação registrada! Obrigado pelo apoio.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
