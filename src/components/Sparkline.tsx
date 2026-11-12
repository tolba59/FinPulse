import React, { useId, useState } from 'react';
import { GraphTimeframe, SparklinePoint } from '../types';
import { formatEur } from '../utils/formatters';

interface SparklineProps {
  data: (number | SparklinePoint)[];
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

  // Normalize points: handle both raw numbers and SparklinePoint objects
  const rawPoints: { val: number; label: string }[] = data
    .map((item, idx) => {
      if (typeof item === 'number') {
        return {
          val: item,
          label:
            timeframe === '1D'
              ? `${String(9 + Math.floor((idx / data.length) * 8.5)).padStart(2, '0')}:00`
              : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx % 7],
        };
      }
      return {
        val: item.price,
        label: item.label || (timeframe === '1D' ? '14:00' : 'Wed'),
      };
    })
    .filter((p) => !isNaN(p.val) && p.val > 0);

  if (rawPoints.length < 2) return null;

  const width = 280;
  const paddingX = 4;
  const paddingY = 6;

  const min = Math.min(...rawPoints.map((p) => p.val));
  const max = Math.max(...rawPoints.map((p) => p.val));
  const range = max - min || 1;

  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  const points = rawPoints.map((pt, idx) => {
    const x = paddingX + (idx / (rawPoints.length - 1)) * usableWidth;
    const y = paddingY + usableHeight - ((pt.val - min) / range) * usableHeight;
    return { x, y, val: pt.val, label: pt.label };
  });

  // Build smooth SVG curve
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

  // Clamped horizontal position for hover tooltip to prevent overflow
  let tooltipLeftPercent = 50;
  if (activePoint) {
    const rawPercent = (activePoint.x / width) * 100;
    tooltipLeftPercent = Math.max(16, Math.min(84, rawPercent));
  }

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

      {/* Hover price tag tooltip with short hour (1D) or short day (7D) */}
      {activePoint && (
        <div
          className="absolute top-0 transform -translate-x-1/2 -translate-y-1 pointer-events-none z-10 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-900 border border-slate-700 text-slate-100 shadow-md whitespace-nowrap flex items-center gap-1.5"
          style={{
            left: `${tooltipLeftPercent}%`,
          }}
        >
          <span className="font-semibold text-white">{formatEur(activePoint.val)}</span>
          <span className="text-slate-500 font-sans">·</span>
          <span className="text-emerald-400 font-medium">{activePoint.label}</span>
        </div>
      )}
    </div>
  );
};
