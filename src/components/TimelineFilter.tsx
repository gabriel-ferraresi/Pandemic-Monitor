import { CalendarIcon, ClockIcon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

interface TimelineFilterProps {
    activeRange: string;
    onChangeRange: (range: string) => void;
    isEventSelected?: boolean;
}

export function TimelineFilter({ activeRange, onChangeRange, isEventSelected }: TimelineFilterProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    // Reage automaticamente aos cliques nos cards do globo
    useEffect(() => {
        if (isEventSelected) {
            setIsExpanded(false);
        } else {
            setIsExpanded(true);
        }
    }, [isEventSelected]);

    const ranges = [
        { id: 'live', label: 'Tempo Real (Live)', icon: ClockIcon },
        { id: '24h', label: 'Últimas 24h', icon: CalendarIcon },
        { id: '7d', label: '7 Dias', icon: CalendarIcon },
        { id: '30d', label: '30 Dias', icon: CalendarIcon }
    ];

    return (
        <div className="absolute top-6 left-24 z-40 flex items-center group">
            <div className="bg-white/60 dark:bg-black/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/80 rounded-full p-1.5 flex items-center shadow-[0_4px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.6)] transition-colors duration-500">

                {/* Botão Retrátil (Aba) */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-3 py-1.5 rounded-full flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-slate-600 group-hover:text-slate-900 dark:text-zinc-500 dark:group-hover:text-zinc-300"
                >
                    <span className="relative flex h-2 w-2">
                        {activeRange === 'live' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${activeRange === 'live' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-600'}`}></span>
                    </span>
                    <span className="text-xs font-mono tracking-wider font-semibold uppercase flex items-center gap-1.5">
                        Monitoramento
                    </span>

                    <div className="transition-transform duration-300">
                        {isExpanded ? <ChevronLeftIcon className="w-3.5 h-3.5" /> : <ChevronRightIcon className="w-3.5 h-3.5" />}
                    </div>
                </button>

                {/* Filtros em gaveta animada */}
                <div
                    className={`flex items-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${isExpanded ? 'max-w-[500px] opacity-100' : 'max-w-0 opacity-0'}`}
                >
                    <div className="h-4 w-px bg-slate-300 dark:bg-zinc-800/80 mx-1"></div>

                    <div className="flex items-center gap-1 pl-1">
                        {ranges.map((range) => {
                            const Icon = range.icon;
                            const isActive = activeRange === range.id;

                            return (
                                <button
                                    key={range.id}
                                    onClick={() => onChangeRange(range.id)}
                                    className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap
                                        ${isActive
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 inset-shadow-sm shadow-[0_0_15px_rgba(16,185,129,0.05)] dark:shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-white/5 border border-transparent'}
                                    `}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {range.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
