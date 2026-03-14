import { Globe2, Activity, ShieldAlert, MapPin, Newspaper, Settings } from "lucide-react";
import { cn } from "../utils";

const NAV_ITEMS = [
  { id: 'global', icon: Globe2, label: 'Globo' },
  { id: 'local', icon: MapPin, label: 'Local' },
  { id: 'outbreaks', icon: Activity, label: 'Surtos' },
  { id: 'threats', icon: ShieldAlert, label: 'Ameaças' },
  { id: 'news', icon: Newspaper, label: 'Notícias' },
];

export function MobileBottomNav({ activeView, onViewChange, onOpenSettings }: { activeView: string, onViewChange: (view: string) => void, onOpenSettings: () => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 transition-colors duration-500 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-[56px]",
                isActive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 dark:text-zinc-500 active:text-slate-800 dark:active:text-zinc-300"
              )}
            >
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              )}
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-mono font-semibold uppercase tracking-wider leading-none">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-[56px] text-slate-500 dark:text-zinc-500 active:text-slate-800 dark:active:text-zinc-300"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[9px] font-mono font-semibold uppercase tracking-wider leading-none">Config</span>
        </button>
      </div>
    </nav>
  );
}
