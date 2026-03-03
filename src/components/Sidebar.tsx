import { AlertTriangle, TrendingUp, Activity, ShieldAlert, ChevronRight, MapPin, BrainCircuit, Radar } from "lucide-react";
import { cn, translateSeverity } from "../utils";
import { GlobalIntelligence } from "../services/healthIntelligence";

export function Sidebar({ data, onAlertClick }: { data: GlobalIntelligence, onAlertClick: (item: any, type: 'outbreak' | 'anomaly') => void }) {
  const STATS = [
    { label: 'Registros Forenses (DB)', value: data.historyLength || 1, trend: 'Histórico Seguro', icon: ShieldAlert, color: 'text-slate-600 dark:text-zinc-300', glow: 'shadow-[0_0_15px_rgba(100,100,100,0.15)] dark:shadow-[0_0_15px_rgba(255,255,255,0.05)]' },
    { label: 'Patógenos Monitorados', value: data.stats.monitoredPathogens, trend: 'Em tempo real', icon: Activity, color: 'text-blue-600 dark:text-blue-500', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]' },
    { label: 'Anomalias Ativas', value: data.stats.activeAnomalies, trend: 'Investigando', icon: Radar, color: 'text-orange-600 dark:text-orange-500', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]' },
    { label: 'Previsões Geradas', value: data.predictions?.length || 0, trend: 'Próx. 30 dias', icon: BrainCircuit, color: 'text-emerald-600 dark:text-emerald-500', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]' },
  ];

  return (
    <div className="w-[400px] h-full flex flex-col gap-6 p-6 overflow-y-auto bg-white/60 dark:bg-black/60 backdrop-blur-xl border-l border-slate-200 dark:border-white/10 z-10 relative shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[-4px_0_24px_rgba(0,0,0,0.5)] transition-colors duration-500 custom-scrollbar">

      {/* Global Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {STATS.map((stat, i) => (
          <div key={i} className={cn("p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white dark:from-white/5 dark:to-transparent border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-default group relative overflow-hidden", stat.glow)}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <stat.icon className={cn("w-4 h-4", stat.color)} />
              <span className="text-[10px] font-mono text-slate-600 dark:text-zinc-500 group-hover:text-slate-800 dark:group-hover:text-zinc-400 bg-white dark:bg-black/50 px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/5 transition-colors">{stat.trend}</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight relative z-10 transition-colors">{stat.value}</div>
            <div className="text-[10px] text-slate-600 dark:text-zinc-400 font-medium uppercase tracking-wider mt-1 relative z-10 transition-colors">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* AI Predictions Section */}
      <div className="flex flex-col mb-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
            <BrainCircuit className="w-4 h-4 text-emerald-500" />
            Previsões da IA (30d)
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {data.predictions.map((pred, index) => (
            <div key={`${pred.id}-${index}`} className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-500/10 dark:to-transparent border border-emerald-200 dark:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-emerald-500 uppercase">{pred.disease}</span>
                <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded border transition-colors",
                  pred.riskLevel === 'CRITICAL' ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/20 dark:border-red-500/50 dark:text-red-400" :
                    pred.riskLevel === 'HIGH' ? "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/20 dark:border-orange-500/50 dark:text-orange-400" :
                      "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:border-yellow-500/50 dark:text-yellow-400"
                )}>RISCO: {translateSeverity(pred.riskLevel)}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-zinc-300 mb-2 transition-colors">{pred.forecast}</p>
              <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-zinc-400 transition-colors">
                <MapPin className="w-3 h-3" /> {pred.region}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Outbreaks Feed */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4 mt-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Surtos Confirmados
          </h2>
        </div>

        <div className="flex flex-col gap-3 pr-2 overflow-y-auto custom-scrollbar">
          {data.outbreaks.map((outbreak, index) => (
            <div
              key={`${outbreak.id}-${index}`}
              onClick={() => onAlertClick(outbreak, 'outbreak')}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer hover:translate-x-1",
                outbreak.severity === 'CRITICAL' ? "bg-gradient-to-r from-red-50 to-white dark:from-red-500/10 dark:to-transparent border-red-200 dark:border-red-500/30 hover:border-red-300 dark:hover:border-red-500/50" :
                  outbreak.severity === 'HIGH' ? "bg-gradient-to-r from-orange-50 to-white dark:from-orange-500/10 dark:to-transparent border-orange-200 dark:border-orange-500/30 hover:border-orange-300 dark:hover:border-orange-500/50" :
                    "bg-gradient-to-r from-blue-50 to-white dark:from-blue-500/10 dark:to-transparent border-blue-200 dark:border-blue-500/30 hover:border-blue-300 dark:hover:border-blue-500/50"
              )}
            >
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

              <h3 className="text-slate-800 dark:text-white text-sm font-medium mb-1 transition-colors">{outbreak.summary}</h3>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-white/10 transition-colors">
                <span className="text-xs text-slate-600 dark:text-zinc-400 flex items-center gap-1 transition-colors"><MapPin className="w-3 h-3" /> {outbreak.country}</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-white transition-colors">CASOS: {outbreak.casesEstimate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
