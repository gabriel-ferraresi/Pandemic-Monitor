import { Activity, AlertTriangle, MapPin, TrendingUp } from "lucide-react";
import { GlobalIntelligence } from "../../services/healthIntelligence";
import { cn, translateSeverity } from "../../utils";

export function OutbreaksView({ data, onAlertClick, isMobile = false }: { data: GlobalIntelligence, onAlertClick: (item: any) => void, isMobile?: boolean }) {
  return (
    <div className={cn("flex flex-col transition-colors duration-500", isMobile ? "w-full p-4" : "w-[600px] h-full bg-white/90 dark:bg-black/80 backdrop-blur-2xl border-l border-slate-200 dark:border-white/10 z-10 relative shadow-[-4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[-4px_0_24px_rgba(0,0,0,0.5)]")}>
      <div className="p-6 border-b border-slate-200 dark:border-white/10 transition-colors">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
          <Activity className="w-5 h-5 text-red-600 dark:text-red-500" />
          Surtos Confirmados
        </h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 transition-colors">Monitoramento detalhado de surtos ativos e suas tendências.</p>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar">
        <div className="grid gap-4">
          {data.outbreaks.map((outbreak, index) => (
            <div
              key={`${outbreak.id}-${index}`}
              onClick={() => onAlertClick(outbreak)}
              className={cn(
                "p-5 rounded-xl border transition-all cursor-pointer hover:translate-x-1",
                outbreak.severity === 'CRITICAL' ? "bg-gradient-to-r from-red-50 dark:from-red-500/10 to-transparent border-red-200 dark:border-red-500/30 hover:border-red-300 dark:hover:border-red-500/50" :
                  outbreak.severity === 'HIGH' ? "bg-gradient-to-r from-orange-50 dark:from-orange-500/10 to-transparent border-orange-200 dark:border-orange-500/30 hover:border-orange-300 dark:hover:border-orange-500/50" :
                    "bg-gradient-to-r from-blue-50 dark:from-blue-500/10 to-transparent border-blue-200 dark:border-blue-500/30 hover:border-blue-300 dark:hover:border-blue-500/50"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    outbreak.severity === 'CRITICAL' ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500" :
                      outbreak.severity === 'HIGH' ? "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-500" :
                        "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-500"
                  )}>
                    {outbreak.severity === 'CRITICAL' && <AlertTriangle className="w-5 h-5" />}
                    {outbreak.severity === 'HIGH' && <Activity className="w-5 h-5" />}
                    {(outbreak.severity === 'MODERATE' || outbreak.severity === 'LOW') && <TrendingUp className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-slate-800 dark:text-white font-bold text-lg transition-colors">{outbreak.disease}</h3>
                    <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-zinc-400 transition-colors">
                      <MapPin className="w-3 h-3" /> {outbreak.country}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "text-xs font-bold px-2 py-1 rounded border uppercase tracking-wider transition-colors",
                    outbreak.severity === 'CRITICAL' ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-500/20 dark:border-red-500/50 dark:text-red-400" :
                      outbreak.severity === 'HIGH' ? "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-500/20 dark:border-orange-500/50 dark:text-orange-400" :
                        "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/20 dark:border-blue-500/50 dark:text-blue-400"
                  )}>
                    {translateSeverity(outbreak.severity)}
                  </div>
                </div>
              </div>

              <p className="text-slate-600 dark:text-zinc-300 text-sm mb-4 leading-relaxed transition-colors">{outbreak.summary}</p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-white/10 transition-colors">
                <div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1 transition-colors">Casos Estimados</div>
                  <div className="text-lg font-mono font-bold text-slate-800 dark:text-white transition-colors">{outbreak.casesEstimate}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1 transition-colors">Tendência</div>
                  <div className="text-sm font-mono text-slate-600 dark:text-zinc-300 flex items-center gap-1 transition-colors">
                    {outbreak.trend === 'up' ? <><TrendingUp className="w-4 h-4 text-red-600 dark:text-red-500" /> Crescente</> :
                      outbreak.trend === 'down' ? <span className="text-emerald-600 dark:text-emerald-500">↘ Em queda</span> :
                        <span className="text-blue-600 dark:text-blue-500">→ Estável</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
