import { Activity } from "lucide-react";

export function BottomTicker({ news }: { news: string[] }) {
  return (
    <div className="h-8 border-t border-slate-200 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-md z-10 relative flex items-center px-4 overflow-hidden transition-colors duration-500">
      <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-zinc-500 whitespace-nowrap shrink-0 border-r border-slate-200 dark:border-white/10 pr-4 mr-4 transition-colors">
        <Activity className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
        FEED AO VIVO
      </div>

      <div className="flex-1 overflow-hidden relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}>
        <div className="animate-marquee flex whitespace-nowrap w-max text-xs font-mono hover:[animation-play-state:paused]">
          <div className="flex gap-12 pr-12">
            {news.map((item, i) => (
              <span key={i} className={i % 2 === 0 ? "text-slate-600 dark:text-zinc-400" : "text-emerald-600 dark:text-emerald-400"}>
                {item}
              </span>
            ))}
          </div>
          {/* Replica exata para encavalar perfeitamente no limite dos 50% de Marquee */}
          <div className="flex gap-12 pr-12" aria-hidden="true">
            {news.map((item, i) => (
              <span key={`dup-${i}`} className={i % 2 === 0 ? "text-slate-600 dark:text-zinc-400" : "text-emerald-600 dark:text-emerald-400"}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
