import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
} from 'lucide-react';
import { fetchIntradayTicks } from '../services/quotesService';
import { AssetCategory, GraphTimeframe, NormalizedQuote, SparklinePoint, WatchlistItem } from '../types';
import { formatEur, formatPercent, getHeatmapStyle } from '../utils/formatters';
import { RangeBar } from './RangeBar';
import { Sparkline } from './Sparkline';

interface AssetCardProps {
  item: WatchlistItem;
  quote?: NormalizedQuote;
  globalTimeframe?: GraphTimeframe;
  isEditMode: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onUpdate: (updated: { name: string; category: AssetCategory }) => void;
}

const CATEGORY_STYLES: Record<AssetCategory, string> = {
  ETF: 'text-indigo-400 bg-indigo-950/40 border border-indigo-800/40',
  'US Stock': 'text-sky-400 bg-sky-950/40 border border-sky-800/40',
  'EU Stock': 'text-amber-400 bg-amber-950/40 border border-amber-800/40',
  Crypto: 'text-purple-400 bg-purple-950/40 border border-purple-800/40',
};

export const AssetCard: React.FC<AssetCardProps> = ({
  item,
  quote,
  globalTimeframe = '7D',
  isEditMode,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDelete,
  onUpdate,
}) => {
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editCat, setEditCat] = useState<AssetCategory>(item.category);

  // Timeframe for the graph: 1D (Intraday) or 7D (Weekly Trend)
  const [cardTimeframe, setCardTimeframe] = useState<GraphTimeframe>(globalTimeframe);
  const [custom1DTicks, setCustom1DTicks] = useState<SparklinePoint[] | null>(null);

  // Sync with global timeframe when it changes
  useEffect(() => {
    setCardTimeframe(globalTimeframe);
  }, [globalTimeframe]);

  // When 1D is selected, fetch intraday if not yet fetched
  const handleSelectTimeframe = async (tf: GraphTimeframe) => {
    setCardTimeframe(tf);
    if (tf === '1D' && !custom1DTicks && quote) {
      const ticks = await fetchIntradayTicks(item.symbol, quote.conversionRateApplied);
      if (ticks && ticks.length >= 3) {
        setCustom1DTicks(ticks);
      }
    }
  };

  const priceEur = quote?.priceEur ?? 0;
  const prevClose = quote?.previousCloseEur ?? priceEur;
  const dayLow = quote?.dayLowEur ?? priceEur;
  const dayHigh = quote?.dayHighEur ?? priceEur;
  const fiftyTwoLow = quote?.fiftyTwoWeekLowEur ?? dayLow;
  const fiftyTwoHigh = quote?.fiftyTwoWeekHighEur ?? dayHigh;

  // Dynamically calculate active change % and euro change based on the selected timeframe
  const is1D = cardTimeframe === '1D';
  const activeChangePercent = is1D
    ? quote?.changePercent ?? 0
    : quote?.change7dPercent ?? quote?.changePercent ?? 0;
  const activeChangeEur = is1D
    ? quote?.changeEur ?? 0
    : quote?.change7dEur ?? quote?.changeEur ?? 0;
  const periodLabel = is1D ? 'today' : 'past 7d';

  // Heatmap styling reacts directly to the selected timeframe's percentage!
  const heatmap = getHeatmapStyle(activeChangePercent);

  // Pick sparkline data based on active timeframe
  const sparklineData = useMemo(() => {
    if (cardTimeframe === '1D' && custom1DTicks && custom1DTicks.length >= 3) {
      return custom1DTicks;
    }
    if (quote?.sparklines?.[cardTimeframe]) {
      return quote.sparklines[cardTimeframe];
    }
    return quote?.sparkline || [];
  }, [cardTimeframe, custom1DTicks, quote]);

  const handleSaveInline = () => {
    if (editName.trim()) {
      onUpdate({ name: editName.trim(), category: editCat });
    }
    setIsEditingInline(false);
  };

  return (
    <div
      className={`relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 ${heatmap.cardClasses}`}
    >
      {/* Edit Mode Top Toolbar */}
      {isEditMode && (
        <div className="mb-3 flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              disabled={!canMoveUp}
              title="Move Up in Watchlist"
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 transition-colors border border-slate-700 cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Up</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              disabled={!canMoveDown}
              title="Move Down in Watchlist"
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 transition-colors border border-slate-700 cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Down</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingInline ? (
              <button
                onClick={() => {
                  setEditName(item.name);
                  setEditCat(item.category);
                  setIsEditingInline(true);
                }}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 px-2 py-1 rounded border border-slate-700/60 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                Rename
              </button>
            ) : (
              <button
                onClick={handleSaveInline}
                className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 px-2 py-1 rounded transition-colors cursor-pointer"
              >
                <Check className="w-3 h-3" />
                Save
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete from Watchlist"
              className="p-1 rounded bg-rose-950/60 border border-rose-800/50 text-rose-400 hover:bg-rose-900/80 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Inline Edit Form */}
      {isEditingInline ? (
        <div className="mb-3 space-y-2 rounded-lg bg-slate-900/90 border border-slate-700 p-2.5">
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold">Display Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-0.5 w-full rounded bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold">Category</label>
            <select
              value={editCat}
              onChange={(e) => setEditCat(e.target.value as AssetCategory)}
              className="mt-0.5 w-full rounded bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ETF">ETF</option>
              <option value="US Stock">US Stock</option>
              <option value="EU Stock">EU Stock</option>
              <option value="Crypto">Crypto</option>
            </select>
          </div>
        </div>
      ) : (
        /* 1. Header */
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-100 text-sm leading-tight truncate" title={item.name}>
              {item.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="font-mono font-medium text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded border border-slate-700/60">
                {item.symbol}
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${CATEGORY_STYLES[item.category] || 'text-slate-400'}`}>
                {item.category}
              </span>
              {quote?.isConvertedFromUsd && (
                <span
                  title={`Converted from USD to EUR at rate 1 EUR = ${quote.conversionRateApplied.toFixed(4)} USD`}
                  className="font-mono text-[9px] font-medium text-amber-300/90 bg-amber-950/40 border border-amber-700/40 px-1 py-0.2 rounded"
                >
                  USD → EUR
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Primary Price Row - Dynamically reflects selected period (1D or 7D) */}
      <div className="my-3 flex items-baseline justify-between gap-2">
        <div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
            {formatEur(priceEur)}
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-400 flex items-center gap-1 mt-0.5">
            <span className={activeChangeEur >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {formatEur(activeChangeEur, { showSign: true })}
            </span>
            <span className="text-slate-500 text-[10px]">{periodLabel}</span>
          </div>
        </div>

        {/* Change Badge for the selected timeframe */}
        <div
          className={`flex items-center gap-0.5 px-2.5 py-1 rounded-md text-xs font-bold font-mono tabular-nums shrink-0 transition-colors ${heatmap.badgeClasses}`}
          title={`${is1D ? '1-Day' : '7-Day'} price change`}
        >
          {activeChangePercent > 0 ? (
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : activeChangePercent < 0 ? (
            <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : null}
          <span>{formatPercent(activeChangePercent)}</span>
        </div>
      </div>

      {/* 3. Graph with 1D / 7D Timeframe Selector */}
      <div className="my-1.5">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-[10px] text-slate-500 font-medium">
            {is1D ? 'Intraday' : '7D Trend'}
          </span>
          <div className="flex items-center gap-0.5 bg-slate-950/80 p-0.5 rounded border border-slate-800">
            {(['1D', '7D'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => handleSelectTimeframe(tf)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                  cardTimeframe === tf
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700/80'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <Sparkline
          data={sparklineData}
          color={heatmap.sparklineColor}
          timeframe={cardTimeframe}
          height={40}
        />
      </div>

      {/* 4. 52-Week Range Bar */}
      <div className="my-2 pt-1">
        <RangeBar current={priceEur} low={fiftyTwoLow} high={fiftyTwoHigh} />
      </div>

      {/* 5. Footer Metrics (Day Range & Prev Close) */}
      <div className="mt-2 pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
        <div>
          <div className="text-[10px] text-slate-500 font-sans">Day Range</div>
          <div className="tabular-nums text-slate-300 text-[11px] truncate">
            {formatEur(dayLow)} – {formatEur(dayHigh)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-500 font-sans">Prev Close</div>
          <div className="tabular-nums text-slate-300 text-[11px] truncate">
            {formatEur(prevClose)}
          </div>
        </div>
      </div>
    </div>
  );
};
