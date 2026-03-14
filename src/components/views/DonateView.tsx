import { useState, useEffect } from "react";
import { Heart, Globe2, Users, Zap, Server, Brain } from "lucide-react";
import { cn } from "../../utils";
import { DonateModal } from "../donate/DonateModal";
import { DonationWall } from "../donate/DonationWall";

interface DonateViewProps {
  isMobile?: boolean;
}

interface DonationStats {
  totalDonors: number;
  totalDonations: number;
  methodBreakdown: { pix: number; card: number; crypto: number };
}

const IMPACT_ITEMS = [
  { icon: Server, label: 'Servidores', desc: 'Infraestrutura 24/7 para dados em tempo real' },
  { icon: Brain, label: 'IA Avançada', desc: 'Modelos de inteligência artificial para análise preditiva' },
  { icon: Globe2, label: 'Cobertura Global', desc: 'Monitoramento de ameaças em todos os continentes' },
  { icon: Zap, label: 'Alertas em Tempo Real', desc: 'Notificações imediatas sobre surtos e anomalias' },
];

export function DonateView({ isMobile }: DonateViewProps) {
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [stats, setStats] = useState<DonationStats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/donations/stats');
        if (res.ok) setStats(await res.json());
      } catch {
        // Silencioso
      }
    })();
  }, []);

  return (
    <div className={cn(
      "h-full overflow-y-auto scrollbar-thin",
      isMobile
        ? "w-full px-4 py-4 space-y-5"
        : "w-[420px] flex-shrink-0 border-l border-slate-200 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-xl shadow-[-4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[-4px_0_24px_rgba(0,0,0,0.5)] px-5 py-6 space-y-6 z-10 relative transition-colors duration-500"
    )}>
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-2xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <Heart className={cn("text-emerald-500 fill-emerald-500", isMobile ? "w-8 h-8" : "w-10 h-10")} />
        </div>
        <h2 className={cn(
          "font-bold text-slate-800 dark:text-white",
          isMobile ? "text-lg" : "text-xl"
        )}>
          Apoie o Pandemic Monitor
        </h2>
        <p className={cn(
          "text-slate-500 dark:text-zinc-400 leading-relaxed",
          isMobile ? "text-xs" : "text-sm"
        )}>
          Esta plataforma é <span className="font-bold text-emerald-600 dark:text-emerald-400">100% gratuita e livre</span>.
          Sua contribuição mantém os servidores, a inteligência artificial e a pesquisa de dados epidemiológicos acessíveis para o mundo inteiro.
        </p>
      </div>

      {/* Botão de doar */}
      <button
        onClick={() => setIsDonateOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-[0.98]"
      >
        <Heart className="w-4 h-4 fill-white" />
        Fazer uma doação
      </button>

      {/* Impacto */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 font-mono">
          Seu apoio sustenta
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {IMPACT_ITEMS.map((item) => (
            <div
              key={item.label}
              className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1.5"
            >
              <item.icon className="w-4 h-4 text-emerald-500" />
              <p className="text-xs font-bold text-slate-800 dark:text-white">{item.label}</p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      {stats && stats.totalDonations > 0 && (
        <div className="flex items-center justify-around p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.totalDonors}</div>
            <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase">Apoiadores</div>
          </div>
          <div className="w-px h-8 bg-emerald-500/20" />
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.totalDonations}</div>
            <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase">Doações</div>
          </div>
          <div className="w-px h-8 bg-emerald-500/20" />
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5 mx-auto" />
            </div>
            <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase">Comunidade</div>
          </div>
        </div>
      )}

      {/* Métodos aceitos */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 font-mono">
          Métodos aceitos
        </h3>
        <div className="flex flex-wrap gap-2">
          {['PIX', 'Cartão', 'Bitcoin', 'Ethereum', 'Solana', 'Zcash'].map(m => (
            <span key={m} className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-white/10">
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Mural de apoiadores */}
      <div className="pt-2 border-t border-slate-200 dark:border-white/10">
        <DonationWall isMobile={isMobile} />
      </div>

      {/* FAQ */}
      <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 font-mono">
          Perguntas Frequentes
        </h3>
        <div className="space-y-2">
          {[
            { q: 'O Pandemic Monitor é gratuito?', a: 'Sim! A plataforma é 100% gratuita e aberta. Doações são voluntárias e ajudam a manter os custos.' },
            { q: 'Meus dados estão seguros?', a: 'Toda informação de pagamento é processada pelo Asaas com criptografia de ponta. Nunca armazenamos dados de cartão.' },
            { q: 'Posso doar anonimamente?', a: 'Sim, basta marcar a opção "Aparecer como anônimo" durante a doação.' },
          ].map((faq, i) => (
            <details key={i} className="group">
              <summary className="cursor-pointer text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-emerald-500 transition-colors list-none flex items-center gap-2">
                <span className="text-emerald-500 group-open:rotate-90 transition-transform text-sm">▸</span>
                {faq.q}
              </summary>
              <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1 ml-5 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Modal */}
      <DonateModal isOpen={isDonateOpen} onClose={() => setIsDonateOpen(false)} isMobile={isMobile} />
    </div>
  );
}
