import { Heart, Share2, ArrowLeft } from "lucide-react";
import { cn } from "../../utils";

interface DonationSuccessProps {
  onClose: () => void;
  isMobile?: boolean;
}

export function DonationSuccess({ onClose, isMobile }: DonationSuccessProps) {
  const shareText = "Acabei de apoiar o Pandemic Monitor — plataforma de vigilância epidemiológica com IA! 🌍💚 Acesse: pandemic-monitor.tech86.com.br";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pandemic Monitor — Apoio',
          text: shareText,
          url: 'https://pandemic-monitor.tech86.com.br',
        });
      } catch {
        // Cancelado pelo usuário
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
      } catch {
        // Fallback silencioso
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8 px-4 text-center">
      {/* Animação de coração */}
      <div className="relative">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
        <div className="relative p-6 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-full border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
          <Heart className="w-10 h-10 text-emerald-500 fill-emerald-500" />
        </div>
      </div>

      {/* Mensagem */}
      <div className="space-y-2">
        <h3 className={cn(
          "font-bold text-slate-800 dark:text-white",
          isMobile ? "text-xl" : "text-2xl"
        )}>
          Obrigado pelo apoio! 💚
        </h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm">
          Sua contribuição ajuda a manter o Pandemic Monitor online, livre e acessível para todos.
        </p>
      </div>

      {/* Impacto */}
      <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl max-w-sm">
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono leading-relaxed">
          Cada doação sustenta os custos de IA, servidores e pesquisa de dados epidemiológicos em tempo real para o mundo inteiro.
        </p>
      </div>

      {/* Botões */}
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
          <Share2 className="w-4 h-4" />
          Compartilhar
        </button>
        <button
          onClick={onClose}
          className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Monitor
        </button>
      </div>
    </div>
  );
}
