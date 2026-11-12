import React, { useId, useState } from 'react';
import { GraphTimeframe } from '../types';
import { formatEur } from '../utils/formatters';

interface SparklineProps {
  data: number[];
  color: string;
  timeframe?: GraphTimeframe;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color,
  timeframe = '7D',
  height = 44,
}) => {
  const gradientId = useId();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length < 2) {
    return (
      <div
        className="w-full flex items-center justify-center text-xs text-slate-600 font-mono"
        style={{ height }}
      >
        No chart data
      </div>
    );
  }

  const width = 280;
  const paddingX = 4;
  const paddingY = 6;

  const validData = data.filter((v) => !isNaN(v) && v > 0);
  if (validData.length < 2) return null;

  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const range = max - min || 1;

  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  const points = validData.map((val, idx) => {
    const x = paddingX + (idx / (validData.length - 1)) * usableWidth;
    const y = paddingY + usableHeight - ((val - min) / range) * usableHeight;
    return { x, y, val };
  });

  // Build SVG path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    pathD += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  const fillD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  const lastPoint = points[points.length - 1];
  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="relative w-full overflow-hidden select-none" style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
        onMouseLeave={() => setHoveredIdx(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
          const idx = Math.round(ratio * (points.length - 1));
          setHoveredIdx(idx);
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="85%" stopColor={color} stopOpacity="0.03" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Gradient fill */}
        <path d={fillD} fill={`url(#${gradientId})`} />

        {/* Main curve */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* End dot if not hovered */}
        {lastPoint && hoveredIdx === null && (
          <>
            <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill={color} />
            <circle cx={lastPoint.x} cy={lastPoint.y} r="1.5" fill="#FFFFFF" />
          </>
        )}

        {/* Hover vertical guide & marker */}
        {activePoint && (
          <>
            <line
              x1={activePoint.x}
              y1={paddingY}
              x2={activePoint.x}
              y2={height - paddingY}
              stroke="#64748B"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle cx={activePoint.x} cy={activePoint.y} r="4" fill={color} />
            <circle cx={activePoint.x} cy={activePoint.y} r="2" fill="#FFFFFF" />
          </>
        )}
      </svg>

      {/* Hover price tag tooltip */}
      {activePoint && (
        <div
          className="absolute top-0 transform -translate-x-1/2 -translate-y-1 pointer-events-none z-10 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-900 border border-slate-700 text-slate-200 shadow-md whitespace-nowrap"
          style={{
            left: `${(activePoint.x / width) * 100}%`,
          }}
        >
          {formatEur(activePoint.val)}
          <span className="text-slate-500 ml-1 text-[9px]">{timeframe}</span>
        </div>
      )}
    </div>
  );
};
