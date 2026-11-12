import React, { useRef, useState } from 'react';
import { Download, Upload, X } from 'lucide-react';
import { WatchlistItem } from '../types';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: WatchlistItem[];
  onImport: (imported: WatchlistItem[]) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  watchlist,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(
        {
          appName: 'FinPulse EUR',
          version: '1.0',
          exportedAt: new Date().toISOString(),
          watchlist,
        },
        null,
        2
      );
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finpulse-watchlist-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const listToImport: WatchlistItem[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.watchlist)
          ? parsed.watchlist
          : null;

        if (!listToImport || listToImport.length === 0) {
          throw new Error('No valid watchlist items found in JSON file.');
        }

        // Validate items
        const sanitized: WatchlistItem[] = listToImport
          .map((item, idx) => ({
            id: String(item.id || item.symbol || `asset-${idx}`),
            symbol: String(item.symbol || '').toUpperCase().trim(),
            name: String(item.name || item.symbol || 'Unnamed Asset'),
            category: (['ETF', 'US Stock', 'EU Stock', 'Crypto'].includes(item.category)
              ? item.category
              : 'US Stock') as WatchlistItem['category'],
          }))
          .filter((i) => i.symbol);

        if (sanitized.length === 0) {
          throw new Error('All items in JSON were missing a valid symbol.');
        }

        onImport(sanitized);
        setImportStatus({
          type: 'success',
          message: `Successfully imported ${sanitized.length} assets!`,
        });
        setTimeout(() => {
          onClose();
        }, 1200);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid JSON file format';
        setImportStatus({ type: 'error', message: msg });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Watchlist Backup &amp; Sync</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sync your custom assets between devices using JSON
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {importStatus && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs font-medium ${
              importStatus.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-700/60 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-700/60 text-rose-300'
            }`}
          >
            {importStatus.message}
          </div>
        )}

        <div className="mt-5 space-y-4">
          {/* 1. Export Watchlist */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-200">Export Watchlist (JSON)</div>
              <div className="text-[11px] text-slate-400">
                Download your current list of {watchlist.length} assets to keep a safe backup
              </div>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-100 transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>

          {/* 2. Import Watchlist */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-200">Import Watchlist (JSON)</div>
              <div className="text-[11px] text-slate-400">
                Load a previously saved JSON backup file from another device
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors shrink-0 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
