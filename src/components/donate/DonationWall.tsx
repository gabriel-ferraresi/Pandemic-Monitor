import { useState, useEffect } from "react";
import { Trophy, QrCode, CreditCard, Bitcoin, Clock } from "lucide-react";
import { cn } from "../../utils";

interface WallItem {
  id: number;
  donorName: string;
  method: string;
  cryptoCurrency?: string;
  createdAt: string;
  isTopDonor: boolean;
  rank?: number;
}

const METHOD_ICONS: Record<string, { icon: typeof QrCode; label: string; color: string }> = {
  pix: { icon: QrCode, label: 'PIX', color: 'text-teal-500' },
  card: { icon: CreditCard, label: 'Cartão', color: 'text-blue-500' },
  crypto: { icon: Bitcoin, label: 'Crypto', color: 'text-orange-500' },
};

const CRYPTO_LABELS: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  ZEC: 'Zcash',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'Agora';
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const RANK_STYLES: Record<number, string> = {
  1: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.2)]',
  2: 'bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-400/40',
  3: 'bg-gradient-to-r from-orange-600/20 to-orange-700/20 border-orange-600/40',
};

const RANK_EMOJI: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

interface DonationWallProps {
  isMobile?: boolean;
}

export function DonationWall({ isMobile }: DonationWallProps) {
  const [top11, setTop11] = useState<WallItem[]>([]);
  const [wall, setWall] = useState<WallItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/donations/wall');
        if (res.ok) {
          const data = await res.json();
          setTop11(data.top11 || []);
          setWall(data.wall || []);
        }
      } catch {
        // Silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-500 font-mono">
          <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Carregando mural...
        </div>
      </div>
    );
  }

  const hasData = top11.length > 0 || wall.length > 0;

  if (!hasData) {
    return (
      <div className="text-center py-8 px-4">
        <Trophy className="w-8 h-8 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
        <p className="text-sm text-slate-500 dark:text-zinc-500 font-mono">
          Seja o primeiro a apoiar o projeto!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top 11 — Ranking dos últimos 7 dias */}
      {top11.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 font-mono">
              Top 11 — Últimos 7 Dias
            </h3>
          </div>
          <div className="space-y-1.5">
            {top11.map((item) => {
              const methodInfo = METHOD_ICONS[item.method] || METHOD_ICONS.pix;
              const rankStyle = item.rank ? RANK_STYLES[item.rank] : '';
              const emoji = item.rank ? RANK_EMOJI[item.rank] : '';
              return (
                <div
                  key={`top-${item.rank}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors",
                    rankStyle || "bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                  )}
                >
                  {/* Rank */}
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold",
                    item.rank && item.rank <= 3
                      ? "text-lg"
                      : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-zinc-400"
                  )}>
                    {emoji || `#${item.rank}`}
                  </div>

                  {/* Nome */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-bold truncate",
                      item.rank === 1 ? "text-yellow-600 dark:text-yellow-400" : "text-slate-800 dark:text-white",
                      isMobile ? "text-xs" : "text-sm"
                    )}>
                      {item.donorName}
                    </p>
                  </div>

                  {/* Método */}
                  <div className={cn("flex items-center gap-1 text-[10px] font-mono", methodInfo.color)}>
                    <methodInfo.icon className="w-3 h-3" />
                    {item.cryptoCurrency ? CRYPTO_LABELS[item.cryptoCurrency] || item.cryptoCurrency : methodInfo.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mural Geral */}
      {wall.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 font-mono">
            Mural de Apoiadores ({wall.length})
          </h3>
          <div className="space-y-1">
            {wall.map((item) => {
              const methodInfo = METHOD_ICONS[item.method] || METHOD_ICONS.pix;
              return (
                <div
                  key={`wall-${item.id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                >
                  {/* Nome */}
                  <p className={cn(
                    "flex-1 min-w-0 truncate text-slate-700 dark:text-zinc-400",
                    isMobile ? "text-xs" : "text-sm",
                    item.isTopDonor && "font-bold text-slate-800 dark:text-white"
                  )}>
                    {item.isTopDonor && <Trophy className="w-3 h-3 text-yellow-500 inline mr-1" />}
                    {item.donorName}
                  </p>

                  {/* Método */}
                  <span className={cn("flex items-center gap-1 text-[10px] font-mono flex-shrink-0", methodInfo.color)}>
                    <methodInfo.icon className="w-3 h-3" />
                    {item.cryptoCurrency || methodInfo.label}
                  </span>

                  {/* Data */}
                  <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-600 flex-shrink-0 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDate(item.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
