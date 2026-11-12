import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Cloud,
  CloudDownload,
  CloudUpload,
  Copy,
  Download,
  KeyRound,
  Link2,
  Loader2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  generateRandomSyncCode,
  getLastSyncedTime,
  getSavedSyncCode,
  pullWatchlistFromCloud,
  pushWatchlistToCloud,
  saveSyncCode,
} from '../services/syncService';
import { WatchlistItem } from '../types';
import { formatTimestamp } from '../utils/formatters';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: WatchlistItem[];
  onImport: (imported: WatchlistItem[]) => void;
  syncCode: string | null;
  onSyncCodeChange: (newCode: string | null) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  watchlist,
  onImport,
  syncCode,
  onSyncCodeChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Sync code states
  const [inputCode, setInputCode] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(() => getLastSyncedTime());

  useEffect(() => {
    if (isOpen) {
      setStatus(null);
      setInputCode('');
      setLastSyncTime(getLastSyncedTime());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Generate new Sync Code
  const handleGenerateCode = async () => {
    setIsSyncing(true);
    setStatus(null);
    try {
      const newCode = generateRandomSyncCode();
      const res = await pushWatchlistToCloud(newCode, watchlist);
      if (res.success) {
        onSyncCodeChange(newCode);
        setLastSyncTime(res.updatedAt || Date.now());
        setStatus({
          type: 'success',
          message: `Secret Sync Code ${newCode} generated and portfolio backed up to cloud!`,
        });
      } else {
        setStatus({ type: 'error', message: res.error || 'Failed to upload portfolio' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus({ type: 'error', message: msg });
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Link existing Sync Code
  const handleLinkCode = async () => {
    const clean = inputCode.trim().toUpperCase();
    if (!clean) return;

    setIsSyncing(true);
    setStatus(null);
    try {
      const res = await pullWatchlistFromCloud(clean);
      if (res.success && res.watchlist) {
        onImport(res.watchlist);
        onSyncCodeChange(clean);
        setLastSyncTime(res.updatedAt || Date.now());
        setStatus({
          type: 'success',
          message: `Device successfully linked to ${clean}! Loaded ${res.watchlist.length} assets.`,
        });
        setTimeout(() => onClose(), 1200);
      } else {
        setStatus({
          type: 'error',
          message: res.error || `Sync code "${clean}" not found. Verify on other device.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus({ type: 'error', message: msg });
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. Push current local to cloud
  const handlePushCurrent = async () => {
    if (!syncCode) return;
    setIsSyncing(true);
    setStatus(null);
    try {
      const res = await pushWatchlistToCloud(syncCode, watchlist);
      if (res.success) {
        setLastSyncTime(res.updatedAt || Date.now());
        setStatus({
          type: 'success',
          message: `Portfolio (${watchlist.length} assets) uploaded to cloud under ${syncCode}.`,
        });
      } else {
        setStatus({ type: 'error', message: res.error || 'Upload failed' });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Pull latest from cloud
  const handlePullLatest = async () => {
    if (!syncCode) return;
    setIsSyncing(true);
    setStatus(null);
    try {
      const res = await pullWatchlistFromCloud(syncCode);
      if (res.success && res.watchlist) {
        onImport(res.watchlist);
        setLastSyncTime(res.updatedAt || Date.now());
        setStatus({
          type: 'success',
          message: `Latest portfolio downloaded (${res.watchlist.length} assets).`,
        });
      } else {
        setStatus({ type: 'error', message: res.error || 'Download failed' });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // 5. Unlink device
  const handleUnlink = () => {
    saveSyncCode(null);
    onSyncCodeChange(null);
    setLastSyncTime(null);
    setStatus({
      type: 'success',
      message: 'Device unlinked. Local portfolio retained on this browser.',
    });
  };

  // 6. Copy code
  const handleCopy = () => {
    if (!syncCode) return;
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 7. Manual JSON Export
  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(
        {
          appName: 'FinPulse EUR',
          version: '1.0',
          exportedAt: new Date().toISOString(),
          syncCode: syncCode || undefined,
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

  // 8. Manual JSON Import
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
        if (parsed?.syncCode && typeof parsed.syncCode === 'string') {
          saveSyncCode(parsed.syncCode);
          onSyncCodeChange(parsed.syncCode);
        }

        setStatus({
          type: 'success',
          message: `Successfully imported ${sanitized.length} assets!`,
        });
        setTimeout(() => onClose(), 1200);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid JSON file format';
        setStatus({ type: 'error', message: msg });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              Multi-Device Portfolio Sync
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sync your watchlist across devices with a private Secret Code (Zero-Login)
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
        {status && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs font-medium ${
              status.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-700/60 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-700/60 text-rose-300'
            }`}
          >
            {status.message}
          </div>
        )}

        <div className="mt-5 space-y-5">
          {/* Section 1: Secret Code Cloud Sync */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-emerald-400" />
                Cloud Sync Code
              </div>
              {syncCode && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  Linked Active
                </span>
              )}
            </div>

            {syncCode ? (
              /* Already Linked View */
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Your Device Sync Code
                    </div>
                    <div className="text-lg font-bold font-mono tracking-widest text-emerald-300 tabular-nums">
                      {syncCode}
                    </div>
                  </div>

                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed space-y-1">
                  <div className="font-semibold text-slate-200">How multi-device sync works:</div>
                  <p className="text-slate-400">
                    1. Open FinPulse on your phone or another browser, tap <strong className="text-slate-300">Sync</strong>, and enter <strong className="font-mono text-emerald-300">{syncCode}</strong> under &ldquo;Linking another device?&rdquo;.
                  </p>
                  <p className="text-slate-400">
                    2. Adding, removing, or reordering assets saves to the cloud automatically and pulls on launch. Keep this code private—anyone with it can view or update this list.
                  </p>
                </div>

                {lastSyncTime && (
                  <div className="text-[10px] text-slate-500 font-mono">
                    Last Cloud Sync: {formatTimestamp(lastSyncTime)}
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handlePushCurrent}
                      disabled={isSyncing}
                      title="Overwrite the cloud copy with the list currently on this screen"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSyncing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CloudUpload className="w-3.5 h-3.5" />
                      )}
                      Push Local to Cloud
                    </button>

                    <button
                      onClick={handlePullLatest}
                      disabled={isSyncing}
                      title="Replace the list on this device with the latest saved cloud copy"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <CloudDownload className="w-3.5 h-3.5" />
                      Pull from Cloud
                    </button>

                    <button
                      onClick={handleUnlink}
                      title="Disconnect this browser from the sync code without deleting local data"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-xs transition-colors cursor-pointer ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Unlink
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Manual controls: <strong>Push</strong> saves this device&apos;s list to the cloud; <strong>Pull</strong> loads the cloud list onto this device.
                  </div>
                </div>
              </div>
            ) : (
              /* Not Linked Yet View */
              <div className="space-y-3.5 pt-1">
                {/* Clear 3-step How It Works Box */}
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                  <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                    How it works (Zero-Login)
                  </div>
                  <ol className="text-[11px] text-slate-300 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>
                      <strong className="text-white">First device:</strong> Click <em>Generate Sync Code</em> to get a short private code (e.g. <span className="font-mono text-emerald-300">EUR-8492</span>) and upload your current watchlist.
                    </li>
                    <li>
                      <strong className="text-white">Other devices:</strong> Open this app on your phone or tablet, click <em>Sync</em>, enter that code, and tap <em>Connect</em>.
                    </li>
                    <li>
                      <strong className="text-white">Auto-sync:</strong> Any asset you add, remove, or reorder syncs automatically in the background across linked devices.
                    </li>
                  </ol>
                </div>

                {/* Sub-Option A: Generate Code */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-white">1. Starting on your main device?</div>
                    <div className="text-[11px] text-slate-400">
                      Creates a private code and backs up this watchlist to the cloud
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateCode}
                    disabled={isSyncing}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <KeyRound className="w-3.5 h-3.5" />
                    )}
                    Generate Sync Code
                  </button>
                </div>

                {/* Sub-Option B: Connect with Existing Code */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 space-y-2">
                  <div>
                    <div className="text-xs font-semibold text-white">2. Linking another device?</div>
                    <div className="text-[11px] text-slate-400">
                      Enter the code from your first device to download and sync your watchlist here
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="e.g. EUR-8492"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      className="flex-1 rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white font-mono uppercase tracking-wider placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={handleLinkCode}
                      disabled={isSyncing || !inputCode.trim()}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
                    >
                      {isSyncing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Manual File Backup (JSON) */}
          <div className="space-y-3 pt-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              File Backup (Offline)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Export */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Export JSON</div>
                  <div className="text-[10px] text-slate-400">
                    Save current list to a local file
                  </div>
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>

              {/* Import */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Import JSON</div>
                  <div className="text-[10px] text-slate-400">
                    Load backup from a file
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
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
