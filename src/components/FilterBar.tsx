import React from 'react';
import { ArrowDownNarrowWide, ArrowUpNarrowWide, Search, SlidersHorizontal } from 'lucide-react';
import { AssetCategory, GraphTimeframe, SortOption } from '../types';

interface FilterBarProps {
  categories: { label: string; value: 'All' | AssetCategory; count: number }[];
  activeCategory: 'All' | AssetCategory;
  onSelectCategory: (category: 'All' | AssetCategory) => void;
  sortOption: SortOption;
  onSelectSort: (sort: SortOption) => void;
  searchFilter: string;
  onSearchFilterChange: (val: string) => void;
  globalTimeframe: GraphTimeframe;
  onSelectTimeframe: (tf: GraphTimeframe) => void;
  gainersCount: number;
  losersCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  sortOption,
  onSelectSort,
  searchFilter,
  onSearchFilterChange,
  globalTimeframe,
  onSelectTimeframe,
  gainersCount,
  losersCount,
}) => {
  return (
    <div className="space-y-2.5">
      {/* Category Filter Pills (Horizontal Scroll on Mobile) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => onSelectCategory(cat.value)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                  isActive ? 'bg-emerald-700/80 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Streamlined Search, Timeframe & Sort Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Quick Search in Watchlist */}
        <div className="relative flex-1 min-w-[120px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search ticker or name..."
            value={searchFilter}
            onChange={(e) => onSearchFilterChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 rounded-lg pl-8 pr-6 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
          />
          {searchFilter && (
            <button
              onClick={() => onSearchFilterChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs px-1"
            >
              ×
            </button>
          )}
        </div>

        {/* Global Graph Timeframe (1D, 7D) */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs shrink-0">
          {(['1D', '7D'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => onSelectTimeframe(tf)}
              title={`Set all cards to ${tf === '1D' ? '1 Day (Intraday)' : '7 Days (Weekly Trend)'}`}
              className={`px-2 py-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                globalTimeframe === tf
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center shrink-0">
          <div className="relative">
            <select
              value={sortOption}
              onChange={(e) => onSelectSort(e.target.value as SortOption)}
              title="Sort watchlist"
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg pl-2 pr-6 py-1.5 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none"
            >
              <option value="custom">Custom</option>
              <option value="gainers">Gainers</option>
              <option value="losers">Losers</option>
              <option value="name-asc">A-Z</option>
              <option value="name-desc">Z-A</option>
              <option value="price-desc">Price</option>
            </select>
            <SlidersHorizontal className="w-3 h-3 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Mini Breadth Strip */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
        <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400 font-mono font-medium">
            <ArrowUpNarrowWide className="w-3 h-3" />
            {gainersCount} Gainers
          </span>
          <span className="text-slate-600">·</span>
          <span className="flex items-center gap-1 text-rose-400 font-mono font-medium">
            <ArrowDownNarrowWide className="w-3 h-3" />
            {losersCount} Losers
          </span>
        </div>

        <div className="text-slate-500 text-[10px] hidden xs:block">
          Click 1D or 7D to toggle periods
        </div>
      </div>
    </div>
  );
};
