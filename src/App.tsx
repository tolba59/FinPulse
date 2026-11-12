/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AddAssetModal } from './components/AddAssetModal';
import { AssetCard } from './components/AssetCard';
import { BackupModal } from './components/BackupModal';
import { FilterBar } from './components/FilterBar';
import { Header } from './components/Header';
import { STARTER_WATCHLIST } from './constants/starterWatchlist';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { fetchAllQuotes, getCachedQuotes } from './services/quotesService';
import {
  AssetCategory,
  GraphTimeframe,
  NormalizedQuote,
  RefreshInterval,
  SortOption,
  WatchlistItem,
} from './types';

const STORAGE_KEY_WATCHLIST = 'finpulse_watchlist';
const STORAGE_KEY_INTERVAL = 'finpulse_refresh_interval';
const STORAGE_KEY_TIMEFRAME = 'finpulse_timeframe';

export default function App() {
  const isOnline = useOnlineStatus();

  // 1. Watchlist state
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_WATCHLIST);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load watchlist from localStorage:', e);
    }
    return STARTER_WATCHLIST;
  });

  // Save watchlist changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(watchlist));
    } catch (e) {
      console.error('Failed to persist watchlist:', e);
    }
  }, [watchlist]);

  // 2. Quotes cache state
  const [quotes, setQuotes] = useState<Record<string, NormalizedQuote>>(() => {
    const cached = getCachedQuotes();
    return cached.quotes;
  });
  const [lastUpdated, setLastUpdated] = useState<number>(() => {
    const cached = getCachedQuotes();
    return cached.lastUpdated;
  });
  const [eurUsdRate, setEurUsdRate] = useState<number>(() => {
    const cached = getCachedQuotes();
    return cached.eurUsdRate || 1.0825;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 3. Auto-refresh interval setting
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INTERVAL) as RefreshInterval;
      if (saved === '1h' || saved === '2h' || saved === 'manual') return saved;
    } catch {
      // Default
    }
    return '1h';
  });

  const handleSetRefreshInterval = (interval: RefreshInterval) => {
    setRefreshInterval(interval);
    try {
      localStorage.setItem(STORAGE_KEY_INTERVAL, interval);
    } catch (e) {
      console.error('Failed to save refresh interval:', e);
    }
  };

  // 4. Global graph timeframe (1D, 7D)
  const [globalTimeframe, setGlobalTimeframe] = useState<GraphTimeframe>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TIMEFRAME) as GraphTimeframe;
      if (saved === '1D' || saved === '7D') return saved;
    } catch {
      // Default
    }
    return '7D';
  });

  const handleSetGlobalTimeframe = (tf: GraphTimeframe) => {
    setGlobalTimeframe(tf);
    try {
      localStorage.setItem(STORAGE_KEY_TIMEFRAME, tf);
    } catch (e) {
      console.error('Failed to save timeframe:', e);
    }
  };

  // 5. UI Mode states
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);

  // 6. Filter & Sort states
  const [activeCategory, setActiveCategory] = useState<'All' | AssetCategory>('All');
  const [sortOption, setSortOption] = useState<SortOption>('custom');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // 7. Fetch quotes executor
  const performFetch = useCallback(
    async (symbolsToFetch?: string[]) => {
      const targets = symbolsToFetch || watchlist.map((i) => i.symbol);
      if (targets.length === 0) return;

      setIsLoading(true);
      try {
        const result = await fetchAllQuotes(targets);
        setQuotes(result.quotes);
        setEurUsdRate(result.eurUsdRate);
        setLastUpdated(Date.now());
      } catch (err) {
        console.error('Quote fetch failed:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [watchlist]
  );

  // 8. Initial load and interval check
  useEffect(() => {
    const cached = getCachedQuotes();
    const now = Date.now();
    const intervalMs =
      refreshInterval === '1h'
        ? 3600 * 1000
        : refreshInterval === '2h'
        ? 7200 * 1000
        : Infinity;

    // If cache is empty or older than refresh interval, fetch fresh data
    const isCacheStale = !cached.lastUpdated || now - cached.lastUpdated > intervalMs;

    if (isCacheStale && isOnline) {
      performFetch();
    }

    // Auto-refresh timer checking cadence
    const intervalTimer = setInterval(() => {
      if (refreshInterval === 'manual' || !isOnline) return;
      const currentNow = Date.now();
      const currentCache = getCachedQuotes();
      if (currentNow - currentCache.lastUpdated >= intervalMs) {
        performFetch();
      }
    }, 60 * 1000);

    return () => clearInterval(intervalTimer);
  }, [refreshInterval, isOnline, performFetch]);

  // 9. Watchlist actions
  const handleAddAsset = (newItem: WatchlistItem) => {
    setWatchlist((prev) => {
      if (prev.some((p) => p.symbol === newItem.symbol)) return prev;
      return [newItem, ...prev];
    });
    // Immediately fetch quote for the new asset
    performFetch([newItem.symbol]);
  };

  const handleDeleteAsset = (id: string) => {
    setWatchlist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateAsset = (id: string, updated: { name: string; category: AssetCategory }) => {
    setWatchlist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  // Toggle edit mode and automatically switch to Custom Order so moves are immediately visible
  const handleToggleEditMode = () => {
    setIsEditMode((prev) => {
      const next = !prev;
      if (next && sortOption !== 'custom') {
        setSortOption('custom');
      }
      return next;
    });
  };

  // 10. Filtered and sorted watchlist
  const filteredAndSortedList = useMemo(() => {
    let result = [...watchlist];

    // Category filter
    if (activeCategory !== 'All') {
      result = result.filter((item) => item.category === activeCategory);
    }

    // Text search filter
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.symbol.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortOption === 'gainers') {
      result.sort((a, b) => {
        const changeA = quotes[a.symbol]?.changePercent ?? -Infinity;
        const changeB = quotes[b.symbol]?.changePercent ?? -Infinity;
        return changeB - changeA;
      });
    } else if (sortOption === 'losers') {
      result.sort((a, b) => {
        const changeA = quotes[a.symbol]?.changePercent ?? Infinity;
        const changeB = quotes[b.symbol]?.changePercent ?? Infinity;
        return changeA - changeB;
      });
    } else if (sortOption === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'name-desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOption === 'price-desc') {
      result.sort((a, b) => {
        const priceA = quotes[a.symbol]?.priceEur ?? 0;
        const priceB = quotes[b.symbol]?.priceEur ?? 0;
        return priceB - priceA;
      });
    }

    return result;
  }, [watchlist, activeCategory, searchFilter, sortOption, quotes]);

  // Robust Reorder Handler by Item ID: swaps the item with its adjacent neighbor in the visible list
  const handleMoveAssetById = (itemId: string, direction: 'up' | 'down') => {
    if (sortOption !== 'custom') {
      setSortOption('custom');
    }

    const currentVisibleIndex = filteredAndSortedList.findIndex((i) => i.id === itemId);
    if (currentVisibleIndex === -1) return;

    const targetVisibleIndex = direction === 'up' ? currentVisibleIndex - 1 : currentVisibleIndex + 1;
    if (targetVisibleIndex < 0 || targetVisibleIndex >= filteredAndSortedList.length) return;

    const targetItem = filteredAndSortedList[targetVisibleIndex];

    setWatchlist((prev) => {
      const indexA = prev.findIndex((i) => i.id === itemId);
      const indexB = prev.findIndex((i) => i.id === targetItem.id);
      if (indexA === -1 || indexB === -1) return prev;

      const copy = [...prev];
      const temp = copy[indexA];
      copy[indexA] = copy[indexB];
      copy[indexB] = temp;
      return copy;
    });
  };

  const handleImportWatchlist = (imported: WatchlistItem[]) => {
    setWatchlist(imported);
    performFetch(imported.map((i) => i.symbol));
  };

  // 11. Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<AssetCategory, number> = {
      ETF: 0,
      'US Stock': 0,
      'EU Stock': 0,
      Crypto: 0,
    };

    watchlist.forEach((item) => {
      if (counts[item.category] !== undefined) {
        counts[item.category]++;
      }
    });

    return [
      { label: 'All', value: 'All' as const, count: watchlist.length },
      { label: 'ETFs', value: 'ETF' as const, count: counts.ETF },
      { label: 'US Stocks', value: 'US Stock' as const, count: counts['US Stock'] },
      { label: 'EU Stocks', value: 'EU Stock' as const, count: counts['EU Stock'] },
      { label: 'Crypto', value: 'Crypto' as const, count: counts.Crypto },
    ];
  }, [watchlist]);

  // 12. Breadth stats (gainers vs losers)
  const { gainersCount, losersCount } = useMemo(() => {
    let g = 0;
    let l = 0;
    watchlist.forEach((item) => {
      const q = quotes[item.symbol];
      if (q) {
        if (q.changePercent > 0.0001) g++;
        else if (q.changePercent < -0.0001) l++;
      }
    });
    return { gainersCount: g, losersCount: l };
  }, [watchlist, quotes]);

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Status Bar & Navigation */}
      <Header
        eurUsdRate={eurUsdRate}
        lastUpdated={lastUpdated}
        isLoading={isLoading}
        refreshInterval={refreshInterval}
        isEditMode={isEditMode}
        onRefresh={() => performFetch()}
        onSetRefreshInterval={handleSetRefreshInterval}
        onToggleEditMode={handleToggleEditMode}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Filter & Sort Bar with Global 1D/7D/1M Timeframe */}
        <FilterBar
          categories={categoryCounts}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          sortOption={sortOption}
          onSelectSort={setSortOption}
          searchFilter={searchFilter}
          onSearchFilterChange={setSearchFilter}
          globalTimeframe={globalTimeframe}
          onSelectTimeframe={handleSetGlobalTimeframe}
          gainersCount={gainersCount}
          losersCount={losersCount}
        />

        {/* Edit Mode Notice Banner */}
        {isEditMode && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/50 text-amber-200 text-xs flex items-center justify-between gap-3">
            <span>
              <strong>Edit Mode Active:</strong> Use the <strong>Up</strong> and <strong>Down</strong> buttons on each card to customize the order, or click <strong>Rename</strong> to update display names.
            </span>
            <button
              onClick={() => setIsEditMode(false)}
              className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Done Editing
            </button>
          </div>
        )}

        {/* Watchlist Grid */}
        {filteredAndSortedList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedList.map((item, index) => {
              const quote = quotes[item.symbol];
              return (
                <AssetCard
                  key={item.id}
                  item={item}
                  quote={quote}
                  globalTimeframe={globalTimeframe}
                  isEditMode={isEditMode}
                  canMoveUp={isEditMode && index > 0}
                  canMoveDown={isEditMode && index < filteredAndSortedList.length - 1}
                  onMoveUp={() => handleMoveAssetById(item.id, 'up')}
                  onMoveDown={() => handleMoveAssetById(item.id, 'down')}
                  onDelete={() => handleDeleteAsset(item.id)}
                  onUpdate={(updated) => handleUpdateAsset(item.id, updated)}
                />
              );
            })}
          </div>
        ) : (
          /* Empty Search / Filter State */
          <div className="py-16 text-center rounded-2xl border border-slate-800 bg-slate-900/30 p-8 space-y-3">
            <div className="text-slate-400 text-sm font-medium">
              No assets found matching "{searchFilter || activeCategory}".
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try clearing your search query or reset your category filter to view all tracked assets.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setSearchFilter('');
                  setActiveCategory('All');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                + Add Asset
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600/90 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-white shadow-xl border border-amber-500/50">
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          <span>Offline Mode — Cached data is being used.</span>
        </div>
      )}

      {/* Modals */}
      <AddAssetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddAsset}
        existingSymbols={watchlist.map((i) => i.symbol)}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        watchlist={watchlist}
        onImport={handleImportWatchlist}
      />

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-slate-800/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FinPulse EUR · Personal Multi-Asset Financial Watchlist</span>
          <span>Deterministic Data Pipeline · Zero AI Slop</span>
        </div>
      </footer>
    </div>
  );
}
