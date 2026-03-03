import { X, Activity, MapPin, TrendingUp, Radar, Crosshair } from 'lucide-react';
import { cn, translateSeverity } from "../../utils";

export function SelectedEventPanel({ event, onClose }: { event: any, onClose: () => void }) {
  if (!event) return null;

  return (
    <div className="absolute bottom-8 left-24 w-[420px] bg-white/90 dark:bg-black/80 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden z-40 animate-in fade-in slide-in-from-bottom-8 duration-500 transition-colors">
      {/* Top accent line */}
      <div className="h-1 w-full" style={{ backgroundColor: event.color, boxShadow: `0 0 15px ${event.color}` }} />

      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${event.color}20`, color: event.color }}>
              {event.type === 'outbreak' ? <Activity className="w-6 h-6" /> : <Radar className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight transition-colors">{event.title}</h2>
              <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-zinc-400 mt-1 transition-colors">
                <MapPin className="w-3.5 h-3.5" /> {event.location}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 transition-colors">
            <div className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1 transition-colors">Coordenadas</div>
            <div className="text-sm font-mono text-slate-700 dark:text-zinc-300 flex items-center gap-2 transition-colors">
              <Crosshair className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
              {event.lat.toFixed(4)}, {event.lng.toFixed(4)}
            </div>
          </div>

          {event.type === 'outbreak' && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 transition-colors">
              <div className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1 transition-colors">Casos Estimados</div>
              <div className="text-sm font-mono font-bold text-slate-800 dark:text-white transition-colors">{event.cases}</div>
            </div>
          )}

          {event.type === 'anomaly' && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 transition-colors">
              <div className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1 transition-colors">Confiança da IA</div>
              <div className="text-sm font-mono font-bold text-slate-800 dark:text-white transition-colors">{event.confidence}%</div>
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white dark:from-white/5 dark:to-transparent border border-slate-200 dark:border-white/5 transition-colors">
          <div className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-2 transition-colors">Relatório de Inteligência</div>
          <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed transition-colors">{event.summary}</p>
        </div>

        {event.type === 'outbreak' && (
          <div className="mt-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider transition-colors">Gravidade:</span>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border transition-colors" style={{ color: event.color, borderColor: `${event.color}50`, backgroundColor: `${event.color}10` }}>
                {translateSeverity(event.severity)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider transition-colors">Tendência:</span>
              <span className="text-xs font-mono text-slate-700 dark:text-zinc-300 transition-colors">
                {event.trend === 'up' ? <span className="text-red-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Alta</span> :
                  event.trend === 'down' ? <span className="text-emerald-600 dark:text-emerald-500">Baixa</span> :
                    <span className="text-blue-600 dark:text-blue-500">Estável</span>}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
