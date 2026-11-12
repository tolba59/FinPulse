export type AssetCategory = 'ETF' | 'US Stock' | 'EU Stock' | 'Crypto';

export type GraphTimeframe = '1D' | '7D';

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  category: AssetCategory;
  customOrder?: number;
}

export interface SparklinePoint {
  price: number;
  time?: number;
  label?: string; // e.g. "14:30" for 1D or "Wed" for 7D
}

export interface NormalizedQuote {
  symbol: string;
  originalCurrency: string;
  isConvertedFromUsd: boolean;
  conversionRateApplied: number; // e.g. EURUSD rate if USD was converted, or 1.0

  // Price & metrics all normalized to EUR (€)
  priceEur: number;

  // 1-Day change
  changeEur: number;
  changePercent: number;

  // 7-Day change
  change7dEur: number;
  change7dPercent: number;

  previousCloseEur: number;
  dayLowEur: number;
  dayHighEur: number;
  fiftyTwoWeekLowEur: number;
  fiftyTwoWeekHighEur: number;

  // Multi-timeframe sparkline points with short hover labels
  sparklines: {
    '1D': SparklinePoint[];
    '7D': SparklinePoint[];
  };
  sparkline: number[]; // Backwards-compatible raw number array

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
