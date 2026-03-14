import { Activity, ShieldAlert, Globe2, Clock, RefreshCw, Sun, Moon, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "../utils";

export function Header({
  loading,
  lastUpdated,
  theme,
  onThemeChange,
  onRefreshData,
  isMobile = false
}: {
  loading: boolean,
  lastUpdated: Date,
  theme: 'light' | 'dark',
  onThemeChange: (theme: 'light' | 'dark') => void,
  onRefreshData: () => void,
  isMobile?: boolean
}) {
  const [time, setTime] = useState(new Date());

  const [nextUpdate, setNextUpdate] = useState<Date>(() => {
    const now = new Date();
    const minutes = now.getMinutes();
    let next15 = Math.ceil(minutes / 15) * 15;
    if (next15 === minutes) next15 += 15;
    const next = new Date(now);
    next.setMinutes(next15, 0, 0);
    return next;
  });

  const [statusText, setStatusText] = useState('PRÓXIMA ATUALIZAÇÃO');
  const [timeStr, setTimeStr] = useState('--:--');
  const [isUpdatingState, setIsUpdatingState] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);

      const diff = nextUpdate.getTime() - now.getTime();

      if (diff <= 0) {
        if (diff > -5000) {
          setIsUpdatingState(true);
          setStatusText("ATUALIZANDO DADOS");
          setTimeStr("AGUARDE...");
          onRefreshData();
          // Recalcular próximo update (+15min a partir de agora)
          const next = new Date();
          next.setMinutes(next.getMinutes() + 15, 0, 0);
          setNextUpdate(next);
        }
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeStr(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        setStatusText("PRÓXIMA ATUALIZAÇÃO");
        setIsUpdatingState(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [nextUpdate]);

  // ─── MOBILE HEADER ───
  if (isMobile) {
    return (
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-xl z-20 relative shadow-[0_4px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-colors duration-500">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-br from-red-500/20 to-red-900/20 rounded-lg border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <Activity className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-1">
              PANDEMIC<span className="text-red-500">MONITOR</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status indicator */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/5 transition-colors">
            {loading ? (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500"></span>
                </span>
                <span className="text-orange-500">SYNC</span>
              </>
            ) : (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-500">ON</span>
              </>
            )}
          </div>

          <button
            onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 hover:text-slate-800 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </header>
    );
  }

  // ─── DESKTOP HEADER ───
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-xl z-20 relative shadow-[0_4px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-colors duration-500">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-gradient-to-br from-red-500/20 to-red-900/20 rounded-xl border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <Activity className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            PANDEMIC<span className="text-red-500">MONITOR</span>
          </h1>
          <p className="text-xs text-zinc-400 font-mono tracking-widest uppercase">Inteligência de Saúde Global</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">

          <div className="flex flex-col items-end text-[10px] text-zinc-500 font-mono gap-1.5">
            {/* Linha 1: Última Atualização Servidor */}
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider">ÚLTIMA ATUALIZAÇÃO</span>
              <span className="text-zinc-400 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/5">{lastUpdated.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span>
            </div>

            {/* Linha 2: Contagem Regressiva para a Próxima (15min) */}
            <div className="flex items-center gap-2">
              <RefreshCw className={cn("w-3 h-3", isUpdatingState ? "text-emerald-500 animate-spin" : "text-slate-400 dark:text-zinc-500")} />
              <span className={cn("uppercase tracking-wider transition-colors", isUpdatingState ? "text-emerald-500 font-bold" : "text-slate-500 dark:text-zinc-500")}>
                {statusText}
              </span>
              <span className={cn("font-bold transition-colors bg-white/5 px-2 py-0.5 rounded border", isUpdatingState ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-slate-700 dark:text-zinc-300 border-white/5")}>
                {timeStr}
              </span>
            </div>
          </div>

        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 transition-colors whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
          {time.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false }).replace(',', '')} BRT
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 transition-colors">
          {loading ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span className="text-orange-500">SINCRONIZANDO IA...</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-500 whitespace-nowrap">SISTEMA ONLINE</span>
            </>
          )}
        </div>
        <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />
        <div className="flex items-center gap-4 text-slate-500 dark:text-zinc-400">
          <a
            href="https://tech86.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group"
          >
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-zinc-500 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">By</span>
            <img src="/tech86/logo_color.svg" alt="Tech86" className="h-4 object-contain block dark:hidden opacity-90 group-hover:opacity-100 transition-opacity" />
            <img src="/tech86/logo_branco.svg" alt="Tech86" className="h-4 object-contain hidden dark:block opacity-80 group-hover:opacity-100 transition-opacity" />
          </a>

          <a
            href="https://www.asaas.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:scale-105 transition-all font-bold text-[11px] uppercase tracking-wider whitespace-nowrap"
          >
            <Heart className="w-3 h-3 fill-emerald-500" />
            Apoiar Projeto
          </a>

          <button
            onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 hover:text-slate-800 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
}
