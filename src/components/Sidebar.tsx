import { AlertTriangle, TrendingUp, Activity, ChevronRight, MapPin, BrainCircuit, Radar, ShieldAlert } from "lucide-react";
import { cn, translateSeverity } from "../utils";
import { GlobalIntelligence } from "../services/healthIntelligence";
import { AnimatedCounter } from "./AnimatedCounter";

// Mapear cores do nível de ameaça
const THREAT_STYLES: Record<string, { bg: string, border: string, text: string, glow: string, pulse: boolean }> = {
  'CRÍTICO': { bg: 'bg-red-500/15 dark:bg-red-500/20', border: 'border-red-400/50 dark:border-red-500/40', text: 'text-red-600 dark:text-red-400', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]', pulse: true },
  'ALTO': { bg: 'bg-orange-500/15 dark:bg-orange-500/20', border: 'border-orange-400/50 dark:border-orange-500/40', text: 'text-orange-600 dark:text-orange-400', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]', pulse: false },
  'MODERADO': { bg: 'bg-yellow-500/10 dark:bg-yellow-500/15', border: 'border-yellow-400/40 dark:border-yellow-500/30', text: 'text-yellow-600 dark:text-yellow-400', glow: 'shadow-[0_0_10px_rgba(234,179,8,0.1)]', pulse: false },
  'BAIXO': { bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', border: 'border-emerald-400/40 dark:border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.1)]', pulse: false },
};

// Verifica se um item foi adicionado recentemente (últimas 2 horas)
function isRecent(firstSeen?: string): boolean {
  if (!firstSeen) return false;
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  return (Date.now() - new Date(firstSeen).getTime()) <= TWO_HOURS;
}

export type GlobeFilter = 'all' | 'outbreaks' | 'anomalies';

interface SidebarProps {
  data: GlobalIntelligence;
  onAlertClick: (item: any, type: 'outbreak' | 'anomaly') => void;
  activeGlobeFilter?: GlobeFilter;
  onGlobeFilterChange?: (filter: GlobeFilter) => void;
  isMobile?: boolean;
}

export function Sidebar({ data, onAlertClick, activeGlobeFilter = 'all', onGlobeFilterChange, isMobile = false }: SidebarProps) {
  const threatLevel = data.stats.globalThreatLevel || 'MODERADO';
  const threatStyle = THREAT_STYLES[threatLevel] || THREAT_STYLES['MODERADO'];

  const handleFilterClick = (filter: GlobeFilter) => {
    if (!onGlobeFilterChange) return;
    // Toggle: se já está no filtro, volta para "all"
    onGlobeFilterChange(activeGlobeFilter === filter ? 'all' : filter);
  };

  return (
    <div className={cn(
      "flex flex-col gap-5 overflow-y-auto custom-scrollbar transition-colors duration-500",
      isMobile
        ? "w-full p-4 bg-transparent overflow-x-hidden"
        : "w-[400px] h-full gap-6 p-6 bg-white/60 dark:bg-black/60 backdrop-blur-xl border-l border-slate-200 dark:border-white/10 z-10 relative shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[-4px_0_24px_rgba(0,0,0,0.5)]"
    )}>

      {/* Global Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">

        {/* Nível de Ameaça Global */}
        <div className={cn(
          "p-3 md:p-4 rounded-xl border transition-all cursor-default group relative overflow-hidden min-w-0",
          threatStyle.bg, threatStyle.border, threatStyle.glow
        )}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
          {threatStyle.pulse && (
            <div className="absolute top-3 right-3 w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </div>
          )}
          <div className="flex items-center justify-between mb-2 md:mb-3 relative z-10">
            <ShieldAlert className={cn("w-4 h-4", threatStyle.text)} />
            <span className="text-[9px] md:text-[10px] font-mono text-slate-600 dark:text-zinc-500 bg-white dark:bg-black/50 px-1.5 md:px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/5 transition-colors">Nível Global</span>
          </div>
          <div className={cn("text-base md:text-lg font-black tracking-tight relative z-10 transition-colors", threatStyle.text)}>
            {threatLevel}
          </div>
          <div className="text-[9px] md:text-[10px] text-slate-600 dark:text-zinc-400 font-medium uppercase tracking-wider mt-1 relative z-10 transition-colors">
            Ameaça Global
          </div>
        </div>

        {/* Patógenos Monitorados */}
        <div
          onClick={() => handleFilterClick('outbreaks')}
          className={cn(
            "p-3 md:p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white dark:from-white/5 dark:to-transparent border transition-all cursor-pointer group relative overflow-hidden min-w-0 shadow-[0_0_15px_rgba(59,130,246,0.15)]",
            activeGlobeFilter === 'outbreaks'
              ? "border-blue-400 dark:border-blue-500/60 ring-1 ring-blue-400/30"
              : "border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/30"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
          <div className="flex items-center justify-between mb-2 md:mb-3 relative z-10">
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-500" />
            <span className="text-[9px] md:text-[10px] font-mono text-slate-600 dark:text-zinc-500 group-hover:text-slate-800 dark:group-hover:text-zinc-400 bg-white dark:bg-black/50 px-1.5 md:px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/5 transition-colors">Em tempo real</span>
          </div>
          <div className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight relative z-10 transition-colors">
            <AnimatedCounter value={data.stats.monitoredPathogens} />
          </div>
          <div className="text-[9px] md:text-[10px] text-slate-600 dark:text-zinc-400 font-medium uppercase tracking-wider mt-1 relative z-10 transition-colors">Patógenos Monitorados</div>
        </div>

        {/* Anomalias Ativas */}
        <div
          onClick={() => handleFilterClick('anomalies')}
          className={cn(
            "p-3 md:p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white dark:from-white/5 dark:to-transparent border transition-all cursor-pointer group relative overflow-hidden min-w-0 shadow-[0_0_15px_rgba(249,115,22,0.15)]",
            activeGlobeFilter === 'anomalies'
              ? "border-orange-400 dark:border-orange-500/60 ring-1 ring-orange-400/30"
              : "border-slate-200 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-500/30"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
          <div className="flex items-center justify-between mb-2 md:mb-3 relative z-10">
            <Radar className="w-4 h-4 text-orange-600 dark:text-orange-500" />
            <span className="text-[9px] md:text-[10px] font-mono text-slate-600 dark:text-zinc-500 group-hover:text-slate-800 dark:group-hover:text-zinc-400 bg-white dark:bg-black/50 px-1.5 md:px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/5 transition-colors">Investigando</span>
          </div>
          <div className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight relative z-10 transition-colors">
            <AnimatedCounter value={data.stats.activeAnomalies} />
          </div>
          <div className="text-[9px] md:text-[10px] text-slate-600 dark:text-zinc-400 font-medium uppercase tracking-wider mt-1 relative z-10 transition-colors">Anomalias Ativas</div>
        </div>

        {/* Previsões Geradas */}
        <div className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white dark:from-white/5 dark:to-transparent border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-default group relative overflow-hidden min-w-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
          <div className="flex items-center justify-between mb-2 md:mb-3 relative z-10">
            <BrainCircuit className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            <span className="text-[9px] md:text-[10px] font-mono text-slate-600 dark:text-zinc-500 group-hover:text-slate-800 dark:group-hover:text-zinc-400 bg-white dark:bg-black/50 px-1.5 md:px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/5 transition-colors">Próx. 30 dias</span>
          </div>
          <div className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight relative z-10 transition-colors">
            <AnimatedCounter value={data.predictions?.length || 0} />
          </div>
          <div className="text-[9px] md:text-[10px] text-slate-600 dark:text-zinc-400 font-medium uppercase tracking-wider mt-1 relative z-10 transition-colors">Previsões Geradas</div>
        </div>
      </div>

      {/* AI Predictions Section */}
      <div className="flex flex-col mb-2">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-xs md:text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
            <BrainCircuit className="w-4 h-4 text-emerald-500" />
            Previsões da IA (30d)
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {data.predictions.map((pred, index) => (
            <div key={`${pred.id}-${index}`} className="p-3 md:p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-500/10 dark:to-transparent border border-emerald-200 dark:border-emerald-500/30 transition-colors relative">
              {isRecent(pred.firstSeen) && (
                <span className="absolute top-2 right-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 animate-pulse">
                  NOVO
                </span>
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-emerald-500 uppercase">{pred.disease}</span>
                <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded border transition-colors",
                  pred.riskLevel === 'CRITICAL' ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/20 dark:border-red-500/50 dark:text-red-400" :
                    pred.riskLevel === 'HIGH' ? "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/20 dark:border-orange-500/50 dark:text-orange-400" :
                      "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:border-yellow-500/50 dark:text-yellow-400"
                )}>RISCO: {translateSeverity(pred.riskLevel)}</span>
              </div>
              <p className="text-xs md:text-sm text-slate-700 dark:text-zinc-300 mb-2 transition-colors">{pred.forecast}</p>
              <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-zinc-400 transition-colors">
                <MapPin className="w-3 h-3" /> {pred.region}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Outbreaks Feed */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3 md:mb-4 mt-2 md:mt-4">
          <h2 className="text-xs md:text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Surtos Confirmados
          </h2>
        </div>

        <div className="flex flex-col gap-3 pr-1 md:pr-2 overflow-y-auto custom-scrollbar">
          {data.outbreaks.map((outbreak, index) => (
            <div
              key={`${outbreak.id}-${index}`}
              onClick={() => onAlertClick(outbreak, 'outbreak')}
              className={cn(
                "p-3 md:p-4 rounded-xl border transition-all cursor-pointer hover:translate-x-1 relative",
                outbreak.severity === 'CRITICAL' ? "bg-gradient-to-r from-red-50 to-white dark:from-red-500/10 dark:to-transparent border-red-200 dark:border-red-500/30 hover:border-red-300 dark:hover:border-red-500/50" :
                  outbreak.severity === 'HIGH' ? "bg-gradient-to-r from-orange-50 to-white dark:from-orange-500/10 dark:to-transparent border-orange-200 dark:border-orange-500/30 hover:border-orange-300 dark:hover:border-orange-500/50" :
                    "bg-gradient-to-r from-blue-50 to-white dark:from-blue-500/10 dark:to-transparent border-blue-200 dark:border-blue-500/30 hover:border-blue-300 dark:hover:border-blue-500/50"
              )}
            >
              {isRecent(outbreak.firstSeen) && (
                <span className="absolute top-2 right-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 animate-pulse">
                  NOVO
                </span>
              )}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {outbreak.severity === 'CRITICAL' && <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-500" />}
                  {outbreak.severity === 'HIGH' && <Activity className="w-4 h-4 text-orange-600 dark:text-orange-500" />}
                  {(outbreak.severity === 'MODERATE' || outbreak.severity === 'LOW') && <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-500" />}
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wider",
                    outbreak.severity === 'CRITICAL' ? "text-red-600 dark:text-red-500" :
                      outbreak.severity === 'HIGH' ? "text-orange-600 dark:text-orange-500" :
                        "text-blue-600 dark:text-blue-500"
                  )}>
                    {outbreak.disease}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-zinc-500">{outbreak.trend === 'up' ? '↗' : outbreak.trend === 'down' ? '↘' : '→'}</span>
              </div>

              <h3 className="text-slate-800 dark:text-white text-xs md:text-sm font-medium mb-1 transition-colors">{outbreak.summary}</h3>

              <div className="flex items-center justify-between mt-2 md:mt-3 pt-2 md:pt-3 border-t border-slate-200 dark:border-white/10 transition-colors">
                <span className="text-[10px] md:text-xs text-slate-600 dark:text-zinc-400 flex items-center gap-1 transition-colors"><MapPin className="w-3 h-3" /> {outbreak.country}</span>
                <span className="text-[10px] md:text-xs font-mono font-bold text-slate-800 dark:text-white transition-colors">CASOS: {outbreak.casesEstimate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
