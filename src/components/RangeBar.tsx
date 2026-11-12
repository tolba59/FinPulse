import React from 'react';
import { formatEur } from '../utils/formatters';

interface RangeBarProps {
  current: number;
  low: number;
  high: number;
}

export const RangeBar: React.FC<RangeBarProps> = ({ current, low, high }) => {
  const safeLow = Math.min(low, current);
  const safeHigh = Math.max(high, current);
  const totalRange = safeHigh - safeLow || 1;
  const percent = Math.max(0, Math.min(100, ((current - safeLow) / totalRange) * 100));

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span className="truncate max-w-[45%] text-left">
          <span className="text-slate-500 mr-1 text-[10px]">52W L:</span>
          {formatEur(safeLow)}
        </span>
        <span className="text-[10px] text-slate-500 font-sans font-medium">
          {percent.toFixed(0)}%
        </span>
        <span className="truncate max-w-[45%] text-right">
          <span className="text-slate-500 mr-1 text-[10px]">52W H:</span>
          {formatEur(safeHigh)}
        </span>
      </div>

      <div className="relative h-1.5 w-full bg-slate-800/80 rounded-full overflow-visible">
        {/* Fill from low to current */}
        <div
          className="h-full bg-gradient-to-r from-slate-600 via-slate-500 to-emerald-500/80 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />

        {/* Current position pip marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.7)] border border-slate-900 pointer-events-none transition-all duration-300"
          style={{
            left: `calc(${percent}% - 5px)`,
          }}
        />
      </div>
    </div>
  );
};
