import React, { useEffect, useState } from 'react';
import { Check, Loader2, Plus, Search, X } from 'lucide-react';
import { searchSymbols } from '../services/quotesService';
import { AssetCategory, SearchResultItem, WatchlistItem } from '../types';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: WatchlistItem) => void;
  existingSymbols: string[];
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingSymbols,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResultItem | null>(null);

  // Customized form fields for adding
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<AssetCategory>('US Stock');

  // Debounced search
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelectedResult(null);
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchSymbols(trimmed);
        setResults(found);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleSelectResult = (item: SearchResultItem) => {
    setSelectedResult(item);
    setCustomName(item.shortname || item.longname || item.symbol);

    // Auto-detect category
    const sym = item.symbol.toUpperCase();
    const type = (item.quoteType || item.typeDisp || '').toUpperCase();

    if (type.includes('ETF')) {
      setCustomCategory('ETF');
    } else if (sym.includes('-EUR') || sym.includes('-USD') || type.includes('CRYPTOCURRENCY')) {
      setCustomCategory('Crypto');
    } else if (sym.endsWith('.DE') || sym.endsWith('.PA') || sym.endsWith('.AS')) {
      setCustomCategory('EU Stock');
    } else {
      setCustomCategory('US Stock');
    }
  };

  const handleConfirmAdd = () => {
    if (!selectedResult) return;
    const newItem: WatchlistItem = {
      id: selectedResult.symbol,
      symbol: selectedResult.symbol,
      name: customName.trim() || selectedResult.symbol,
      category: customCategory,
    };
    onAdd(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              Add Asset to Watchlist
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Search by ticker symbol, company name, ETF, or ISIN
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search e.g. AAPL, Microsoft, 6TVM.DE, BTC-EUR, IE00B4L5Y983..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full rounded-xl bg-slate-950 border border-slate-700/80 pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          {isLoading && (
            <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 animate-spin" />
          )}
        </div>

        {/* Results List */}
        <div className="mt-4 max-h-56 overflow-y-auto space-y-1.5 pr-1">
          {isLoading && results.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-400">
              Searching Yahoo Finance...
            </div>
          )}

          {!isLoading && query.trim() && results.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-400">
              No matching assets found for "{query}". Try another ticker or company name.
            </div>
          )}

          {results.map((item) => {
            const isAlreadyAdded = existingSymbols.includes(item.symbol);
            const isSelected = selectedResult?.symbol === item.symbol;

            return (
              <div
                key={item.symbol}
                onClick={() => !isAlreadyAdded && handleSelectResult(item)}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                  isAlreadyAdded
                    ? 'opacity-40 bg-slate-950/40 border-slate-800/40 cursor-not-allowed'
                    : isSelected
                    ? 'bg-emerald-950/40 border-emerald-500 text-white'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-white bg-slate-800 px-1.5 py-0.5 rounded">
                      {item.symbol}
                    </span>
                    <span className="text-xs font-medium text-slate-200 truncate">
                      {item.shortname || item.longname || item.symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span>{item.exchange || 'Exchange'}</span>
                    <span>·</span>
                    <span>{item.quoteType || 'EQUITY'}</span>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  {isAlreadyAdded ? (
                    <span className="text-[10px] text-slate-500 font-medium">Added</span>
                  ) : isSelected ? (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-slate-950">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-400 font-medium hover:underline">
                      Select
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Customization Details before adding */}
        {selectedResult && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
            <div className="text-xs font-semibold text-slate-200">Customize Asset Entry</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase">
                  Display Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase">
                  Category
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as AssetCategory)}
                  className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="ETF">ETF</option>
                  <option value="US Stock">US Stock</option>
                  <option value="EU Stock">EU Stock</option>
                  <option value="Crypto">Crypto</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleConfirmAdd}
              className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white py-2 text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add "{selectedResult.symbol}" to Watchlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
