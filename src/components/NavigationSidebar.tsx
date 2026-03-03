import { Globe2, Activity, ShieldAlert, Syringe, Database, Newspaper, Settings, MapPin } from "lucide-react";
import { cn } from "../utils";

const NAV_ITEMS = [
  { id: 'global', icon: Globe2, label: 'Visão Global' },
  { id: 'local', icon: MapPin, label: 'Minha Região' },
  { id: 'outbreaks', icon: Activity, label: 'Surtos' },
  { id: 'threats', icon: ShieldAlert, label: 'Inteligência de Ameaças' },
  { id: 'news', icon: Newspaper, label: 'Notícias e Relatórios' },
  { id: 'vaccines', icon: Syringe, label: 'Dados de Vacinação' },
  { id: 'pathogens', icon: Database, label: 'Banco de Patógenos' },
];

export function NavigationSidebar({ activeView, onViewChange, onOpenSettings }: { activeView: string, onViewChange: (view: string) => void, onOpenSettings: () => void }) {
  return (
    <div className="w-16 h-full flex flex-col items-center py-6 bg-white/60 dark:bg-black/60 backdrop-blur-xl border-r border-slate-200 dark:border-white/10 z-10 relative shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.5)] transition-colors duration-500">
      <div className="flex flex-col gap-4 w-full px-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "p-3 rounded-xl flex items-center justify-center transition-all group relative",
              activeView === item.id ? "bg-slate-200 text-slate-900 shadow-[inset_0_1px_0_rgba(0,0,0,0.05)] dark:bg-white/10 dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-500 dark:hover:bg-white/5 dark:hover:text-zinc-300"
            )}
          >
            {activeView === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            )}
            <item.icon className="w-5 h-5" />

            {/* Tooltip */}
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-xs font-medium rounded-lg opacity-0 translate-x-[-10px] group-hover:translate-x-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all z-50 shadow-xl">
              {item.label}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-auto w-full px-2">
        <button
          onClick={onOpenSettings}
          className="w-full p-3 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-500 dark:hover:bg-white/5 dark:hover:text-zinc-300 transition-all group relative"
        >
          <Settings className="w-5 h-5" />
          <div className="absolute left-full ml-4 px-3 py-1.5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-xs font-medium rounded-lg opacity-0 translate-x-[-10px] group-hover:translate-x-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all z-50 shadow-xl">
            Configurações
          </div>
        </button>
      </div>
    </div>
  );
}
