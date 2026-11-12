export type AssetCategory = 'ETF' | 'US Stock' | 'EU Stock' | 'Crypto';

export type GraphTimeframe = '1D' | '7D';

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  category: AssetCategory;
  customOrder?: number;
}

export interface NormalizedQuote {
  symbol: string;
  originalCurrency: string;
  isConvertedFromUsd: boolean;
  conversionRateApplied: number; // e.g. EURUSD rate if USD was converted, or 1.0

  // Price & metrics all normalized to EUR (€)
  priceEur: number;
  changeEur: number;
  changePercent: number;
  previousCloseEur: number;
  dayLowEur: number;
  dayHighEur: number;
  fiftyTwoWeekLowEur: number;
  fiftyTwoWeekHighEur: number;

  // Multi-timeframe sparkline close prices in EUR (1D intraday and 7D daily closes)
  sparklines: {
    '1D': number[];
    '7D': number[];
  };
  sparkline: number[]; // Backwards-compatible alias to 7D sparkline

  // Meta
  exchangeName?: string;
  instrumentType?: string;
  lastUpdated: number;
}

export type RefreshInterval = '1h' | '2h' | 'manual';

export type SortOption = 'custom' | 'gainers' | 'losers' | 'name-asc' | 'name-desc' | 'price-desc';

export interface MarketSession {
  name: string;
  code: string;
  isOpen: boolean;
  hoursDesc: string; // e.g. "09:00 - 17:30 CET"
  timeUntilNext: string;
}

export interface SearchResultItem {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  quoteType?: string;
  typeDisp?: string;
}
