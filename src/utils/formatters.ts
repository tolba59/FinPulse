export function formatEur(
  value: number | undefined | null,
  options?: {
    showSign?: boolean;
    forceDecimals?: number;
  }
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '—';
  }

  const { showSign = false, forceDecimals } = options || {};
  const absVal = Math.abs(value);

  // Dynamic decimals: sub-euro assets like ADA get 4 decimals, large get 2
  let decimals = forceDecimals !== undefined ? forceDecimals : absVal < 1.0 && absVal > 0 ? 4 : 2;
  if (absVal >= 10000) {
    decimals = 2;
  }

  const formattedNum = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(absVal);

  const sign = value > 0 ? (showSign ? '+' : '') : value < 0 ? '-' : '';

  return `${sign}€${formattedNum}`;
}

export function formatPercent(
  value: number | undefined | null,
  options?: { showSign?: boolean }
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.00%';
  }

  const { showSign = true } = options || {};
  const sign = value > 0 ? (showSign ? '+' : '') : value < 0 ? '-' : '';
  const absVal = Math.abs(value);

  return `${sign}${absVal.toFixed(2)}%`;
}

export function formatTimestamp(timestamp: number | undefined | null): string {
  if (!timestamp) return 'Never';
  const d = new Date(timestamp);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}

export function getHeatmapStyle(changePercent: number | undefined | null): {
  cardClasses: string;
  badgeClasses: string;
  sparklineColor: string;
  isPositive: boolean;
  isNegative: boolean;
  isNeutral: boolean;
} {
  const p = changePercent ?? 0;
  const isPositive = p > 0.0001;
  const isNegative = p < -0.0001;
  const isNeutral = !isPositive && !isNegative;

  if (isPositive) {
    if (p > 3.0) {
      // Vibrant Emerald Accent (> +3%)
      return {
        cardClasses:
          'bg-gradient-to-br from-emerald-950/40 to-slate-900/90 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.18)] hover:border-emerald-400',
        badgeClasses: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
        sparklineColor: '#10B981',
        isPositive: true,
        isNegative: false,
        isNeutral: false,
      };
    } else if (p >= 1.0) {
      // Medium Emerald Tint/Border (+1% to +3%)
      return {
        cardClasses:
          'bg-gradient-to-br from-emerald-950/25 to-slate-900/80 border-emerald-600/40 shadow-[0_0_15px_rgba(16,185,129,0.10)] hover:border-emerald-500/60',
        badgeClasses: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
        sparklineColor: '#10B981',
        isPositive: true,
        isNegative: false,
        isNeutral: false,
      };
    } else {
      // Subtle Emerald Tint (0% to +1%)
      return {
        cardClasses:
          'bg-slate-900/70 border-emerald-900/40 hover:border-emerald-700/50',
        badgeClasses: 'bg-emerald-500/10 text-emerald-400 border border-emerald-600/20',
        sparklineColor: '#10B981',
        isPositive: true,
        isNegative: false,
        isNeutral: false,
      };
    }
  } else if (isNegative) {
    if (p < -3.0) {
      // Vibrant Crimson Accent (< -3%)
      return {
        cardClasses:
          'bg-gradient-to-br from-rose-950/40 to-slate-900/90 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.18)] hover:border-rose-400',
        badgeClasses: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
        sparklineColor: '#F43F5E',
        isPositive: false,
        isNegative: true,
        isNeutral: false,
      };
    } else if (p <= -1.0) {
      // Medium Crimson Tint/Border (-1% to -3%)
      return {
        cardClasses:
          'bg-gradient-to-br from-rose-950/25 to-slate-900/80 border-rose-600/40 shadow-[0_0_15px_rgba(244,63,94,0.10)] hover:border-rose-500/60',
        badgeClasses: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
        sparklineColor: '#F43F5E',
        isPositive: false,
        isNegative: true,
        isNeutral: false,
      };
    } else {
      // Subtle Crimson Tint (0% to -1%)
      return {
        cardClasses:
          'bg-slate-900/70 border-rose-900/40 hover:border-rose-700/50',
        badgeClasses: 'bg-rose-500/10 text-rose-400 border border-rose-600/20',
        sparklineColor: '#F43F5E',
        isPositive: false,
        isNegative: true,
        isNeutral: false,
      };
    }
  }

  // Neutral (0.00%)
  return {
    cardClasses: 'bg-slate-900/60 border-slate-800 hover:border-slate-700',
    badgeClasses: 'bg-slate-800 text-slate-300 border border-slate-700',
    sparklineColor: '#94A3B8',
    isPositive: false,
    isNegative: false,
    isNeutral: true,
  };
}
