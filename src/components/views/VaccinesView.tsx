import { Syringe, Activity, Globe2 } from "lucide-react";

export function VaccinesView() {
  return (
    <div className="w-[600px] h-full flex flex-col bg-white/90 dark:bg-black/80 backdrop-blur-2xl border-l border-slate-200 dark:border-white/10 z-10 relative shadow-[-4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[-4px_0_24px_rgba(0,0,0,0.5)] transition-colors duration-500">
      <div className="p-6 border-b border-slate-200 dark:border-white/10 transition-colors">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
          <Syringe className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
          Dados de Vacinação
        </h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 transition-colors">Monitoramento global de campanhas de imunização.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 dark:from-white/5 to-transparent border border-slate-200 dark:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <Globe2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500 transition-colors" />
              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 bg-slate-100 dark:bg-black/50 px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/5 transition-colors">Global</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight transition-colors">13.5B</div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium uppercase tracking-wider mt-1 transition-colors">Doses Administradas</div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 dark:from-white/5 to-transparent border border-slate-200 dark:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-500 transition-colors" />
              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 bg-slate-100 dark:bg-black/50 px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/5 transition-colors">População</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight transition-colors">72.4%</div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium uppercase tracking-wider mt-1 transition-colors">Totalmente Imunizados</div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest mb-4 transition-colors">Campanhas em Destaque</h3>
          <div className="grid gap-4">
            {[
              { name: 'Poliomielite', region: 'África Subsaariana', progress: 85, target: 'Erradicação' },
              { name: 'Sarampo', region: 'Europa', progress: 60, target: 'Controle de Surto' },
              { name: 'Dengue (Qdenga)', region: 'América do Sul', progress: 35, target: 'Prevenção Sazonal' }
            ].map((camp, i) => (
              <div key={i} className="p-5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-slate-800 dark:text-white font-bold transition-colors">{camp.name}</h4>
                  <span className="text-xs text-slate-500 dark:text-zinc-400 transition-colors">{camp.region}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-500 mb-2 transition-colors">
                  <span>Progresso</span>
                  <span>{camp.progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-black/50 rounded-full overflow-hidden transition-colors">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${camp.progress}%` }} />
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-3 pt-3 border-t border-slate-200 dark:border-white/10 transition-colors">
                  Meta: <span className="text-slate-800 dark:text-white font-medium transition-colors">{camp.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
