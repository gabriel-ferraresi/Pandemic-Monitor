import { CreditCard, QrCode, Bitcoin } from "lucide-react";
import { cn } from "../../utils";

export type PaymentMethod = 'pix' | 'card' | 'crypto';

const METHODS: { id: PaymentMethod; icon: typeof QrCode; label: string; description: string }[] = [
  { id: 'pix', icon: QrCode, label: 'PIX', description: 'Instantâneo · QR Code' },
  { id: 'card', icon: CreditCard, label: 'Cartão', description: 'Crédito ou Débito' },
  { id: 'crypto', icon: Bitcoin, label: 'Crypto', description: 'BTC · ETH · SOL · ZEC' },
];

interface PaymentMethodSelectorProps {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  isMobile?: boolean;
}

export function PaymentMethodSelector({ selected, onSelect, isMobile }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <label className={cn(
        "block font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-500",
        isMobile ? "text-[10px]" : "text-[11px]"
      )}>
        Método de pagamento
      </label>

      <div className={cn("grid gap-2", isMobile ? "grid-cols-1" : "grid-cols-3")}>
        {METHODS.map((method) => {
          const isActive = selected === method.id;
          return (
            <button
              key={method.id}
              onClick={() => onSelect(method.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all text-left group",
                isActive
                  ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                  : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-emerald-500/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                isActive
                  ? "bg-emerald-500/20 text-emerald-500"
                  : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-zinc-400 group-hover:text-emerald-500"
              )}>
                <method.icon className="w-5 h-5" />
              </div>
              <div>
                <div className={cn(
                  "font-bold text-sm transition-colors",
                  isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-white"
                )}>
                  {method.label}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono">
                  {method.description}
                </div>
              </div>
              {isActive && (
                <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
