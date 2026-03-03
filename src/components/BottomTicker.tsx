import React from "react";
import { Activity } from "lucide-react";

export type TickerItem = {
  id: string;
  title: string;
  type: 'ai' | 'external';
};

export function BottomTicker({ news, onNewsClick }: { news: TickerItem[]; onNewsClick?: (item: TickerItem) => void }) {
  if (!news || news.length === 0) return null;
  const duration = Math.max(30, news.map(n => n.title).join(" ").length * 0.15);

  return (
    <div className="h-8 border-t border-slate-200 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-md z-10 relative flex items-center px-4 overflow-hidden transition-colors duration-500">
      <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-zinc-500 whitespace-nowrap shrink-0 border-r border-slate-200 dark:border-white/10 pr-4 mr-4 transition-colors">
        <Activity className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
        FEED AO VIVO
      </div>

      <div className="flex-1 overflow-hidden relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}>
        <div
          className="flex whitespace-nowrap w-max text-xs font-mono hover:[animation-play-state:paused] ticker-marquee"
          style={{ '--marquee-duration': `${duration}s` } as React.CSSProperties}
        >
          {/* Replica exata duplicada para encavalar perfeitamente no limite dos 50% de Marquee do CSS */}
          {[0, 1].map((replica) => (
            <div key={replica} className="flex gap-12 pr-12" aria-hidden={replica === 1}>
              {news.map((item, i) => (
                <button
                  key={`${replica}-${item.id || i}`}
                  onClick={() => onNewsClick && onNewsClick(item)}
                  className={`hover:underline cursor-pointer transition-colors ${i % 2 === 0 ? "text-slate-600 dark:text-zinc-300" : "text-emerald-700 dark:text-emerald-400"}`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
