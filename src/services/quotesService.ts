import { NormalizedQuote, SearchResultItem, SparklinePoint } from '../types';

const STORAGE_KEY_QUOTES = 'finpulse_quotes_cache';
const STORAGE_KEY_TIMESTAMP = 'finpulse_last_updated';
const STORAGE_KEY_EURUSD = 'finpulse_eurusd_rate';

interface YahooChartMeta {
  currency?: string;
  symbol?: string;
  exchangeName?: string;
  instrumentType?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  shortName?: string;
  longName?: string;
}

interface YahooChartPayload {
  meta?: YahooChartMeta;
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      close?: (number | null)[];
      open?: (number | null)[];
      high?: (number | null)[];
      low?: (number | null)[];
    }>;
  };
}

function formatShortDay(timestampMs: number): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Berlin',
      weekday: 'short',
    }).format(new Date(timestampMs));
  } catch {
    return 'Day';
  }
}

function formatShortHour(timestampMs: number): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Berlin',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(timestampMs));
  } catch {
    return '12:00';
  }
}

// Generate realistic intraday points with hours (e.g. 09:00 to 17:30)
function generate1DIntraday(
  prevClose: number,
  low: number,
  high: number,
  current: number
): SparklinePoint[] {
  const safeLow = Math.min(low, current, prevClose);
  const safeHigh = Math.max(high, current, prevClose);
  const open = prevClose * 0.998;
  const mid1 = (open + safeLow) / 2;
  const mid2 = (safeLow + safeHigh) / 2;
  const mid3 = (safeHigh + current) / 2;

  const rawValues = [
    prevClose,
    open,
    (open + mid1) / 2,
    safeLow,
    (safeLow + mid2) / 2,
    mid2,
    (mid2 + safeHigh) / 2,
    safeHigh,
    mid3,
    (mid3 + current) / 2,
    current,
  ];

  const hoursList = [
    '09:00',
    '09:45',
    '10:30',
    '11:15',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '15:45',
    '16:30',
    '17:30',
  ];

  return rawValues.map((val, idx) => ({
    price: val,
    label: hoursList[idx] || '12:00',
  }));
}

// Generate 7-day fallback points with short day labels (e.g. Thu, Fri, Mon...)
function generate7DPoints(
  prevClose: number,
  current: number
): SparklinePoint[] {
  const rawValues = [
    prevClose * 0.985,
    prevClose * 0.99,
    prevClose * 0.995,
    prevClose,
    prevClose * 1.005,
    (prevClose + current) / 2,
    current,
  ];

  const now = Date.now();
  const dayMs = 86400 * 1000;

  return rawValues.map((val, idx) => {
    const time = now - (6 - idx) * dayMs;
    return {
      price: val,
      time,
      label: formatShortDay(time),
    };
  });
}

export function getCachedQuotes(): {
  quotes: Record<string, NormalizedQuote>;
  lastUpdated: number;
  eurUsdRate: number;
} {
  try {
    const rawQuotes = localStorage.getItem(STORAGE_KEY_QUOTES);
    const rawTime = localStorage.getItem(STORAGE_KEY_TIMESTAMP);
    const rawRate = localStorage.getItem(STORAGE_KEY_EURUSD);

    const quotes = rawQuotes ? JSON.parse(rawQuotes) : {};
    const lastUpdated = rawTime ? parseInt(rawTime, 10) : 0;
    const eurUsdRate = rawRate ? parseFloat(rawRate) : 1.0825;

    // Ensure all quotes have valid 1D and 7D SparklinePoint structures
    for (const key of Object.keys(quotes)) {
      const q = quotes[key];

      // Ensure 7D points have label
      let s7: SparklinePoint[] = [];
      if (Array.isArray(q.sparklines?.['7D']) && q.sparklines['7D'].length > 0) {
        s7 = q.sparklines['7D'].map((item: number | SparklinePoint, idx: number) => {
          if (typeof item === 'number') {
            const time = Date.now() - (6 - idx) * 86400000;
            return { price: item, time, label: formatShortDay(time) };
          }
          return item;
        });
      } else {
        s7 = generate7DPoints(q.previousCloseEur, q.priceEur);
      }

      // Ensure 1D points have label
      let s1: SparklinePoint[] = [];
      if (Array.isArray(q.sparklines?.['1D']) && q.sparklines['1D'].length > 0) {
        s1 = q.sparklines['1D'].map((item: number | SparklinePoint, idx: number) => {
          if (typeof item === 'number') {
            return {
              price: item,
              label: `${String(9 + Math.floor(idx * 0.8)).padStart(2, '0')}:00`,
            };
          }
          return item;
        });
      } else {
        s1 = generate1DIntraday(q.previousCloseEur, q.dayLowEur, q.dayHighEur, q.priceEur);
      }

      // Calculate 7-day change if missing
      const price7dAgo = s7[0]?.price || q.previousCloseEur;
      const change7dEur = q.change7dEur ?? q.priceEur - price7dAgo;
      const change7dPercent =
        q.change7dPercent ?? (price7dAgo > 0 ? (change7dEur / price7dAgo) * 100 : 0);

      q.sparklines = {
        '1D': s1,
        '7D': s7,
      };
      q.sparkline = s7.map((p) => p.price);
      q.change7dEur = change7dEur;
      q.change7dPercent = change7dPercent;
    }

    return { quotes, lastUpdated, eurUsdRate };
  } catch (err) {
    console.error('Failed to read quotes from localStorage:', err);
    return { quotes: {}, lastUpdated: 0, eurUsdRate: 1.0825 };
  }
}

export function saveCachedQuotes(
  quotes: Record<string, NormalizedQuote>,
  lastUpdated: number,
  eurUsdRate: number
) {
  try {
    localStorage.setItem(STORAGE_KEY_QUOTES, JSON.stringify(quotes));
    localStorage.setItem(STORAGE_KEY_TIMESTAMP, lastUpdated.toString());
    localStorage.setItem(STORAGE_KEY_EURUSD, eurUsdRate.toString());
  } catch (err) {
    console.error('Failed to save quotes to localStorage:', err);
  }
}

// Fetch a single Yahoo chart payload using CORS proxies if needed
async function fetchChartDirect(
  symbol: string,
  range = '7d',
  interval = '1d'
): Promise<YahooChartPayload | null> {
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=${range}&interval=${interval}`;

  // Try direct first
  try {
    const res = await fetch(yahooUrl);
    if (res.ok) {
      const data = await res.json();
      return data?.chart?.result?.[0] ?? null;
    }
  } catch {
    // Continue to proxy
  }

  // Try CORS proxy 1: corsproxy.io
  try {
    const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(yahooUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const data = await res.json();
      return data?.chart?.result?.[0] ?? null;
    }
  } catch {
    // Continue to proxy 2
  }

  // Try CORS proxy 2: allorigins.win
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const data = await res.json();
      return data?.chart?.result?.[0] ?? null;
    }
  } catch {
    // Failed all
  }

  return null;
}

// Normalize a single Yahoo chart payload to EUR
function normalizeYahooQuote(
  symbol: string,
  data: YahooChartPayload,
  eurUsdRate: number
): NormalizedQuote {
  const meta = data.meta || {};
  const rawCurrency = (meta.currency || 'EUR').toUpperCase();
  const isUsd = rawCurrency === 'USD';

  // Conversion factor to EUR
  let rateToEur = 1.0;
  let isConverted = false;

  if (isUsd) {
    rateToEur = eurUsdRate > 0 ? 1 / eurUsdRate : 1 / 1.0825;
    isConverted = true;
  } else if (rawCurrency === 'GBP') {
    rateToEur = 1 / 0.85;
    isConverted = true;
  } else if (rawCurrency === 'GBX' || meta.currency === 'GBp') {
    rateToEur = (1 / 100) * (1 / 0.85);
    isConverted = true;
  }

  const rawPrice = meta.regularMarketPrice ?? meta.previousClose ?? 0;
  const rawPrevClose = meta.chartPreviousClose ?? meta.previousClose ?? rawPrice;
  const rawDayLow = meta.regularMarketDayLow ?? Math.min(rawPrice, rawPrevClose);
  const rawDayHigh = meta.regularMarketDayHigh ?? Math.max(rawPrice, rawPrevClose);
  const raw52Low = meta.fiftyTwoWeekLow ?? rawDayLow;
  const raw52High = meta.fiftyTwoWeekHigh ?? rawDayHigh;

  const priceEur = rawPrice * rateToEur;
  const previousCloseEur = rawPrevClose * rateToEur;
  const changeEur = priceEur - previousCloseEur;
  const changePercent = previousCloseEur > 0 ? (changeEur / previousCloseEur) * 100 : 0;
  const dayLowEur = rawDayLow * rateToEur;
  const dayHighEur = rawDayHigh * rateToEur;
  const fiftyTwoWeekLowEur = raw52Low * rateToEur;
  const fiftyTwoWeekHighEur = raw52High * rateToEur;

  // Process 7-day close prices with timestamps
  const rawCloses = data.indicators?.quote?.[0]?.close || [];
  const rawTimestamps = data.timestamp || [];
  const cleaned7DPoints: SparklinePoint[] = [];

  for (let i = 0; i < rawCloses.length; i++) {
    const c = rawCloses[i];
    if (c !== null && c !== undefined && !isNaN(c) && c > 0) {
      const price = c * rateToEur;
      const ts = rawTimestamps[i] ? rawTimestamps[i] * 1000 : Date.now() - (rawCloses.length - 1 - i) * 86400000;
      cleaned7DPoints.push({
        price,
        time: ts,
        label: formatShortDay(ts),
      });
    }
  }

  if (cleaned7DPoints.length > 0) {
    cleaned7DPoints[cleaned7DPoints.length - 1].price = priceEur;
    cleaned7DPoints[cleaned7DPoints.length - 1].label = formatShortDay(Date.now());
  }

  let final7D = cleaned7DPoints;
  if (final7D.length < 2) {
    final7D = generate7DPoints(previousCloseEur, priceEur);
  }

  // Calculate 7-Day Change % and 7-Day Change €
  const price7dAgo = final7D[0]?.price || previousCloseEur;
  const change7dEur = priceEur - price7dAgo;
  const change7dPercent = price7dAgo > 0 ? (change7dEur / price7dAgo) * 100 : 0;

  // 1D Intraday points
  const final1D = generate1DIntraday(previousCloseEur, dayLowEur, dayHighEur, priceEur);

  return {
    symbol,
    originalCurrency: meta.currency || 'EUR',
    isConvertedFromUsd: isConverted,
    conversionRateApplied: isConverted ? eurUsdRate : 1.0,
    priceEur,
    changeEur,
    changePercent,
    change7dEur,
    change7dPercent,
    previousCloseEur,
    dayLowEur,
    dayHighEur,
    fiftyTwoWeekLowEur,
    fiftyTwoWeekHighEur,
    sparklines: {
      '1D': final1D,
      '7D': final7D,
    },
    sparkline: final7D.map((p) => p.price),
    exchangeName: meta.exchangeName,
    instrumentType: meta.instrumentType,
    lastUpdated: Date.now(),
  };
}

// Fallback baseline quotes if offline
const FALLBACK_DEFAULTS: Record<string, Partial<NormalizedQuote>> = {
  '6TVM.DE': { priceEur: 114.82, changeEur: 0.94, changePercent: 0.83, change7dEur: 2.10, change7dPercent: 1.86, previousCloseEur: 113.88, dayLowEur: 113.6, dayHighEur: 115.1, fiftyTwoWeekLowEur: 92.4, fiftyTwoWeekHighEur: 116.5 },
  'LYPG.DE': { priceEur: 62.15, changeEur: 1.12, changePercent: 1.84, change7dEur: 2.80, change7dPercent: 4.72, previousCloseEur: 61.03, dayLowEur: 60.8, dayHighEur: 62.4, fiftyTwoWeekLowEur: 44.5, fiftyTwoWeekHighEur: 63.8 },
  'F50A.DE': { priceEur: 98.40, changeEur: 0.52, changePercent: 0.53, change7dEur: 1.40, change7dPercent: 1.44, previousCloseEur: 97.88, dayLowEur: 97.5, dayHighEur: 98.9, fiftyTwoWeekLowEur: 80.2, fiftyTwoWeekHighEur: 99.8 },
  '6AQQ.DE': { priceEur: 85.30, changeEur: 1.45, changePercent: 1.73, change7dEur: 3.20, change7dPercent: 3.90, previousCloseEur: 83.85, dayLowEur: 83.4, dayHighEur: 85.7, fiftyTwoWeekLowEur: 62.0, fiftyTwoWeekHighEur: 86.9 },
  'GOAI.DE': { priceEur: 38.65, changeEur: 0.88, changePercent: 2.33, change7dEur: 1.65, change7dPercent: 4.46, previousCloseEur: 37.77, dayLowEur: 37.5, dayHighEur: 38.9, fiftyTwoWeekLowEur: 26.5, fiftyTwoWeekHighEur: 39.4 },
  'NVDA': { priceEur: 135.20, changeEur: 4.60, changePercent: 3.52, change7dEur: 8.40, change7dPercent: 6.62, previousCloseEur: 130.60, dayLowEur: 129.8, dayHighEur: 136.1, fiftyTwoWeekLowEur: 45.0, fiftyTwoWeekHighEur: 142.0, isConvertedFromUsd: true },
  'AMD': { priceEur: 138.40, changeEur: -2.10, changePercent: -1.49, change7dEur: -4.50, change7dPercent: -3.15, previousCloseEur: 140.50, dayLowEur: 137.2, dayHighEur: 141.0, fiftyTwoWeekLowEur: 115.0, fiftyTwoWeekHighEur: 210.0, isConvertedFromUsd: true },
  'GOOGL': { priceEur: 168.10, changeEur: 1.25, changePercent: 0.75, change7dEur: 3.10, change7dPercent: 1.88, previousCloseEur: 166.85, dayLowEur: 165.5, dayHighEur: 169.0, fiftyTwoWeekLowEur: 120.0, fiftyTwoWeekHighEur: 182.0, isConvertedFromUsd: true },
  'AMZN': { priceEur: 194.50, changeEur: 2.30, changePercent: 1.20, change7dEur: 5.60, change7dPercent: 2.96, previousCloseEur: 192.20, dayLowEur: 191.0, dayHighEur: 195.4, fiftyTwoWeekLowEur: 132.0, fiftyTwoWeekHighEur: 202.0, isConvertedFromUsd: true },
  'IBM': { priceEur: 202.15, changeEur: -0.85, changePercent: -0.42, change7dEur: 1.20, change7dPercent: 0.60, previousCloseEur: 203.00, dayLowEur: 201.2, dayHighEur: 204.0, fiftyTwoWeekLowEur: 142.0, fiftyTwoWeekHighEur: 235.0, isConvertedFromUsd: true },
  'ENR.DE': { priceEur: 46.20, changeEur: 1.80, changePercent: 4.05, change7dEur: 4.10, change7dPercent: 9.74, previousCloseEur: 44.40, dayLowEur: 44.1, dayHighEur: 46.5, fiftyTwoWeekLowEur: 11.2, fiftyTwoWeekHighEur: 47.8 },
  'NOA3.DE': { priceEur: 4.35, changeEur: -0.06, changePercent: -1.36, change7dEur: -0.12, change7dPercent: -2.68, previousCloseEur: 4.41, dayLowEur: 4.32, dayHighEur: 4.45, fiftyTwoWeekLowEur: 3.1, fiftyTwoWeekHighEur: 4.8 },
  'BTC-EUR': { priceEur: 88500.0, changeEur: 2450.0, changePercent: 2.85, change7dEur: 6200.0, change7dPercent: 7.53, previousCloseEur: 86050.0, dayLowEur: 85200.0, dayHighEur: 89400.0, fiftyTwoWeekLowEur: 34000.0, fiftyTwoWeekHighEur: 92000.0 },
  'ETH-EUR': { priceEur: 3120.0, changeEur: -45.0, changePercent: -1.42, change7dEur: 120.0, change7dPercent: 4.00, previousCloseEur: 3165.0, dayLowEur: 3080.0, dayHighEur: 3220.0, fiftyTwoWeekLowEur: 1850.0, fiftyTwoWeekHighEur: 3800.0 },
  'SOL-EUR': { priceEur: 195.40, changeEur: 8.60, changePercent: 4.60, change7dEur: 22.0, change7dPercent: 12.69, previousCloseEur: 186.80, dayLowEur: 184.0, dayHighEur: 198.5, fiftyTwoWeekLowEur: 52.0, fiftyTwoWeekHighEur: 205.0 },
  'XRP-EUR': { priceEur: 0.685, changeEur: 0.025, changePercent: 3.79, change7dEur: 0.082, change7dPercent: 13.60, previousCloseEur: 0.660, dayLowEur: 0.650, dayHighEur: 0.695, fiftyTwoWeekLowEur: 0.420, fiftyTwoWeekHighEur: 0.740 },
  'ADA-EUR': { priceEur: 0.542, changeEur: -0.012, changePercent: -2.17, change7dEur: 0.045, change7dPercent: 9.05, previousCloseEur: 0.554, dayLowEur: 0.535, dayHighEur: 0.565, fiftyTwoWeekLowEur: 0.280, fiftyTwoWeekHighEur: 0.720 },
};

function createFallbackQuote(symbol: string, eurUsdRate: number): NormalizedQuote {
  const d = FALLBACK_DEFAULTS[symbol] || {};
  const priceEur = d.priceEur ?? 100.0;
  const previousCloseEur = d.previousCloseEur ?? 98.5;
  const changeEur = d.changeEur ?? priceEur - previousCloseEur;
  const changePercent = d.changePercent ?? (changeEur / previousCloseEur) * 100;
  const dayLowEur = d.dayLowEur ?? priceEur * 0.98;
  const dayHighEur = d.dayHighEur ?? priceEur * 1.02;

  const sparkline7D = generate7DPoints(previousCloseEur, priceEur);
  const sparkline1D = generate1DIntraday(previousCloseEur, dayLowEur, dayHighEur, priceEur);

  const price7dAgo = sparkline7D[0]?.price || previousCloseEur;
  const change7dEur = d.change7dEur ?? priceEur - price7dAgo;
  const change7dPercent = d.change7dPercent ?? (price7dAgo > 0 ? (change7dEur / price7dAgo) * 100 : 0);

  return {
    symbol,
    originalCurrency: d.isConvertedFromUsd ? 'USD' : 'EUR',
    isConvertedFromUsd: !!d.isConvertedFromUsd,
    conversionRateApplied: d.isConvertedFromUsd ? eurUsdRate : 1.0,
    priceEur,
    changeEur,
    changePercent,
    change7dEur,
    change7dPercent,
    previousCloseEur,
    dayLowEur,
    dayHighEur,
    fiftyTwoWeekLowEur: d.fiftyTwoWeekLowEur ?? priceEur * 0.75,
    fiftyTwoWeekHighEur: d.fiftyTwoWeekHighEur ?? priceEur * 1.25,
    sparklines: {
      '1D': sparkline1D,
      '7D': sparkline7D,
    },
    sparkline: sparkline7D.map((p) => p.price),
    exchangeName: symbol.endsWith('.DE') ? 'XETRA' : symbol.includes('-EUR') ? 'Crypto' : 'NASDAQ',
    lastUpdated: Date.now(),
  };
}

export async function fetchAllQuotes(
  symbols: string[],
  range = '7d'
): Promise<{ quotes: Record<string, NormalizedQuote>; eurUsdRate: number }> {
  if (symbols.length === 0) {
    return { quotes: {}, eurUsdRate: 1.0825 };
  }

  const { quotes: existingCache, eurUsdRate: cachedRate } = getCachedQuotes();
  let eurUsdRate = cachedRate || 1.0825;

  let rawQuotesMap: Record<string, YahooChartPayload> | null = null;

  try {
    const res = await fetch(
      `/api/quotes?symbols=${encodeURIComponent(symbols.join(','))}&range=${range}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.quotes) {
        rawQuotesMap = data.quotes;
        if (data.eurUsdRate && data.eurUsdRate > 0) {
          eurUsdRate = data.eurUsdRate;
        }
      }
    }
  } catch (err) {
    console.warn('/api/quotes endpoint unavailable, falling back to direct CORS proxies...', err);
  }

  if (!rawQuotesMap) {
    rawQuotesMap = {};

    try {
      const eurUsdData = await fetchChartDirect('EURUSD=X', '7d', '1d');
      if (eurUsdData?.meta?.regularMarketPrice && eurUsdData.meta.regularMarketPrice > 0) {
        eurUsdRate = eurUsdData.meta.regularMarketPrice;
      }
    } catch (e) {
      console.warn('Could not fetch EURUSD=X, using rate:', eurUsdRate, e);
    }

    const batchSize = 6;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (sym) => {
          try {
            const chartData = await fetchChartDirect(sym, '7d', '1d');
            if (chartData) {
              rawQuotesMap![sym] = chartData;
            }
          } catch (e) {
            console.error(`Failed to fetch quote for ${sym}:`, e);
          }
        })
      );
    }
  }

  const updatedQuotes: Record<string, NormalizedQuote> = { ...existingCache };

  for (const sym of symbols) {
    const raw = rawQuotesMap[sym];
    if (raw && raw.meta?.regularMarketPrice) {
      updatedQuotes[sym] = normalizeYahooQuote(sym, raw, eurUsdRate);
    } else if (!updatedQuotes[sym]) {
      updatedQuotes[sym] = createFallbackQuote(sym, eurUsdRate);
    }
  }

  const now = Date.now();
  saveCachedQuotes(updatedQuotes, now, eurUsdRate);

  return { quotes: updatedQuotes, eurUsdRate };
}

// Fetch high-resolution 1D intraday with hours for a single symbol
export async function fetchIntradayTicks(
  symbol: string,
  eurUsdRate: number
): Promise<SparklinePoint[] | null> {
  try {
    let payload: YahooChartPayload | null = null;
    try {
      const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbol)}&range=1d`);
      if (res.ok) {
        const data = await res.json();
        payload = data?.quotes?.[symbol] ?? null;
      }
    } catch {
      // fallback
    }

    if (!payload) {
      payload = await fetchChartDirect(symbol, '1d', '5m');
    }

    if (payload?.indicators?.quote?.[0]?.close) {
      const isUsd = (payload.meta?.currency || '').toUpperCase() === 'USD';
      const rate = isUsd && eurUsdRate > 0 ? 1 / eurUsdRate : 1.0;
      const closes = payload.indicators.quote[0].close;
      const timestamps = payload.timestamp || [];

      const points: SparklinePoint[] = [];
      for (let i = 0; i < closes.length; i++) {
        const v = closes[i];
        if (v !== null && v !== undefined && !isNaN(v) && v > 0) {
          const ts = timestamps[i] ? timestamps[i] * 1000 : Date.now();
          points.push({
            price: v * rate,
            time: ts,
            label: formatShortHour(ts),
          });
        }
      }

      if (points.length >= 3) {
        return points;
      }
    }
  } catch (err) {
    console.error('Failed to fetch intraday ticks:', err);
  }
  return null;
}

export async function searchSymbols(query: string): Promise<SearchResultItem[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.quotes && Array.isArray(data.quotes)) {
        return data.quotes;
      }
    }
  } catch (err) {
    console.warn('/api/search unavailable, trying CORS fallback...', err);
  }

  const yahooSearchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
    q
  )}&quotesCount=10&newsCount=0`;

  try {
    const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(yahooSearchUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const data = await res.json();
      if (data?.quotes && Array.isArray(data.quotes)) {
        return data.quotes;
      }
    }
  } catch {
    // Try second proxy
  }

  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooSearchUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const data = await res.json();
      if (data?.quotes && Array.isArray(data.quotes)) {
        return data.quotes;
      }
    }
  } catch (err) {
    console.error('All search endpoints failed:', err);
  }

  return [];
}
