import { cn } from "../../utils";

const PRESET_VALUES = [10, 25, 50, 100, 250, 500];

interface ValueSelectorProps {
  value: number;
  onChange: (value: number) => void;
  isMobile?: boolean;
}

export function ValueSelector({ value, onChange, isMobile }: ValueSelectorProps) {
  const isCustom = !PRESET_VALUES.includes(value) && value > 0;

  return (
    <div className="space-y-3">
      <label className={cn(
        "block font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-500",
        isMobile ? "text-[10px]" : "text-[11px]"
      )}>
        Valor da doação (R$)
      </label>

      {/* Grid de valores pré-definidos */}
      <div className="grid grid-cols-3 gap-2">
        {PRESET_VALUES.map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className={cn(
              "py-2.5 rounded-xl font-bold text-sm transition-all border",
              value === preset
                ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105"
                : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-white/10 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
            )}
          >
            R$ {preset}
          </button>
        ))}
      </div>

      {/* Input customizado */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 dark:text-zinc-500">R$</span>
        <input
          type="number"
          min={5}
          max={50000}
          step={0.01}
          placeholder="Outro valor..."
          value={isCustom ? value : ''}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v) && v >= 0) onChange(Math.min(v, 50000));
          }}
          className={cn(
            "w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-mono transition-all bg-white dark:bg-white/5 outline-none",
            isCustom
              ? "border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-emerald-500/50"
          )}
        />
      </div>

      {value > 0 && value < 5 && (
        <p className="text-xs text-red-500 font-mono">Valor mínimo: R$ 5,00</p>
      )}
    </div>
  );
}
