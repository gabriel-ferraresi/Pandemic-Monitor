import { ShieldAlert, BrainCircuit, Radar, MapPin } from "lucide-react";
import { GlobalIntelligence } from "../../services/healthIntelligence";
import { cn, translateSeverity } from "../../utils";

export function ThreatsView({ data, onAlertClick }: { data: GlobalIntelligence, onAlertClick: (item: any) => void }) {
  return (
    <div className="w-[600px] h-full flex flex-col bg-white/90 dark:bg-black/80 backdrop-blur-2xl border-l border-slate-200 dark:border-white/10 z-10 relative shadow-[-4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[-4px_0_24px_rgba(0,0,0,0.5)] transition-colors duration-500">
      <div className="p-6 border-b border-slate-200 dark:border-white/10 transition-colors">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
          <ShieldAlert className="w-5 h-5 text-yellow-500" />
          Inteligência de Ameaças
        </h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 transition-colors">Análise preditiva e detecção de anomalias pela IA.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-8">

        {/* Anomalies Section */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-4 transition-colors">
            <Radar className="w-4 h-4 text-purple-600 dark:text-purple-500" />
            Anomalias Detectadas
          </h3>
          <div className="grid gap-4">
            {data.anomalies.map((anomaly, index) => (
              <div
                key={`${anomaly.id}-${index}`}
                onClick={() => onAlertClick(anomaly)}
                className="p-5 rounded-xl bg-gradient-to-r from-purple-50 to-white dark:from-purple-500/10 dark:to-transparent border border-purple-200 dark:border-purple-500/30 hover:border-purple-300 dark:hover:border-purple-500/50 transition-all cursor-pointer hover:translate-x-1"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-500 transition-colors">
                      <Radar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-slate-800 dark:text-white font-bold text-lg transition-colors">Padrão Anômalo</h4>
                      <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-zinc-400 transition-colors">
                        <MapPin className="w-3 h-3" /> {anomaly.location}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold px-2 py-1 rounded border uppercase tracking-wider bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-500/20 dark:border-purple-500/50 dark:text-purple-400 transition-colors">
                      Confiança: {anomaly.confidence}%
                    </div>
                  </div>
                </div>
                <p className="text-slate-700 dark:text-zinc-300 text-sm leading-relaxed transition-colors">{anomaly.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Predictions Section */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-4 transition-colors">
            <BrainCircuit className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            Previsões da IA (30 dias)
          </h3>
          <div className="grid gap-4">
            {data.predictions.map((pred, index) => (
              <div key={`${pred.id}-${index}`} className="p-5 rounded-xl bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-500/10 dark:to-transparent border border-emerald-200 dark:border-emerald-500/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 transition-colors">
                      <BrainCircuit className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-slate-800 dark:text-white font-bold text-lg transition-colors">{pred.disease}</h4>
                      <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-zinc-400 transition-colors">
                        <MapPin className="w-3 h-3" /> {pred.region}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "text-xs font-bold px-2 py-1 rounded border uppercase tracking-wider transition-colors",
                      pred.riskLevel === 'CRITICAL' ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-500/20 dark:border-red-500/50 dark:text-red-400" :
                        pred.riskLevel === 'HIGH' ? "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-500/20 dark:border-orange-500/50 dark:text-orange-400" :
                          "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-500/20 dark:border-yellow-500/50 dark:text-yellow-400"
                    )}>
                      Risco: {translateSeverity(pred.riskLevel)}
                    </div>
                  </div>
                </div>
                <p className="text-slate-700 dark:text-zinc-300 text-sm leading-relaxed transition-colors">{pred.forecast}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
