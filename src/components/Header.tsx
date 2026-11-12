import React from 'react';
import {
  Clock,
  Database,
  Edit3,
  Plus,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { RefreshInterval } from '../types';
import { formatTimestamp } from '../utils/formatters';
import { getMarketSessions } from '../utils/marketStatus';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  eurUsdRate: number;
  lastUpdated: number;
  isLoading: boolean;
  refreshInterval: RefreshInterval;
  isEditMode: boolean;
  onRefresh: () => void;
  onSetRefreshInterval: (interval: RefreshInterval) => void;
  onToggleEditMode: () => void;
  onOpenAddModal: () => void;
  onOpenBackupModal: () => void;
  isScrolled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  eurUsdRate,
  lastUpdated,
  isLoading,
  refreshInterval,
  isEditMode,
  onRefresh,
  onSetRefreshInterval,
  onToggleEditMode,
  onOpenAddModal,
  onOpenBackupModal,
  isScrolled = false,
}) => {
  const sessions = getMarketSessions();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // When scrolled on mobile: render a sleek, minimal 42px bar
  if (isScrolled) {
    return (
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#090D16]/95 backdrop-blur-md transition-all duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-11 flex items-center justify-between gap-2">
          {/* Minimal Brand - Tap to scroll top */}
          <button
            onClick={scrollToTop}
            title="Scroll to top to expand details"
            className="flex items-center gap-2 text-left cursor-pointer group"
          >
            <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-white font-sans group-hover:text-emerald-400 transition-colors">
              FinPulse <span className="text-emerald-400 font-mono">EUR</span>
            </span>
          </button>

          {/* Quick Metrics & Actions Strip */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Minimal EUR/USD rate */}
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] sm:text-xs font-mono"
              title="Live EUR/USD rate"
            >
              <span className="text-slate-500 hidden xs:inline">EUR/USD:</span>
              <span className="text-emerald-400 font-semibold tabular-nums">
                {eurUsdRate ? eurUsdRate.toFixed(4) : '1.0825'}
              </span>
            </div>

            {/* Quick Refresh Icon */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh Quotes"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`}
              />
            </button>

            {/* Quick Edit Mode Icon */}
            <button
              onClick={onToggleEditMode}
              title={isEditMode ? 'Done Editing' : 'Edit List'}
              className={`p-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                isEditMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {/* Minimal + Add Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  // When at top of page: Full Expanded Header showing ALL details!
  return (
    <header className="border-b border-slate-800/80 bg-[#090D16] transition-all duration-200">
      {/* 1. Main Brand & Full Actions Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-sans">
                FinPulse <span className="text-emerald-400 font-mono text-sm sm:text-base">EUR</span>
              </h1>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/50">
                PWA Terminal
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>All prices normalized to EUR (€)</span>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Backup Button */}
          <button
            onClick={onOpenBackupModal}
            title="Backup & Sync Watchlist (JSON)"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>Backup</span>
          </button>

          {/* Edit List Button */}
          <button
            onClick={onToggleEditMode}
            title={isEditMode ? 'Finish Editing' : 'Edit & Reorder List'}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 border cursor-pointer ${
              isEditMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditMode ? 'Done Editing' : 'Edit List'}</span>
          </button>

          {/* + Add Asset Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* 2. Full Expanded Market Status & Refresh Sub-Bar */}
      <div className="border-t border-slate-800/60 bg-[#0B101E]/60 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
          {/* Market Session Badges */}
          <div className="flex items-center flex-wrap gap-2 text-[11px]">
            <span className="text-slate-500 font-medium hidden sm:inline">Markets (CET):</span>
            {sessions.map((s) => (
              <div
                key={s.code}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800/80"
                title={`${s.name} (${s.hoursDesc}) — ${s.timeUntilNext}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    s.isOpen ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
                <span className="font-semibold text-slate-300">{s.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {s.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
            ))}

            {/* EUR/USD Rate Badge */}
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800/80 text-[11px]"
              title="Live FX conversion rate used for US stocks"
            >
              <span className="text-slate-500 font-mono">EUR/USD:</span>
              <span className="font-mono font-semibold text-emerald-400 tabular-nums">
                {eurUsdRate ? eurUsdRate.toFixed(4) : '1.0825'}
              </span>
            </div>
          </div>

          {/* Refresh cadence, Last Updated, and Manual Refresh */}
          <div className="flex items-center gap-3 text-[11px]">
            {/* Auto-Refresh Select */}
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
              <select
                value={refreshInterval}
                onChange={(e) => onSetRefreshInterval(e.target.value as RefreshInterval)}
                className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2 py-0.5 text-[11px] focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="1h">Auto: 1 hour</option>
                <option value="2h">Auto: 2 hours</option>
                <option value="manual">Manual only</option>
              </select>
            </div>

            {/* Last Updated Timestamp */}
            <div className="text-slate-400 font-mono">
              <span className="text-slate-500">Updated: </span>
              <span className="text-slate-300 tabular-nums">{formatTimestamp(lastUpdated)}</span>
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh Quotes"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`}
              />
              <span className="text-[11px] font-medium hidden sm:inline">
                {isLoading ? 'Fetching...' : 'Refresh'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
