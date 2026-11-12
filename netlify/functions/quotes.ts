interface YahooChartResult {
  chart?: {
    result?: Array<{
      meta?: {
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
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: (number | null)[];
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          volume?: (number | null)[];
        }>;
      };
    }>;
    error?: {
      code?: string;
      description?: string;
    };
  };
}

export async function handler(event: {
  queryStringParameters?: Record<string, string>;
  httpMethod?: string;
}) {
  const allowedHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: allowedHeaders,
      body: '',
    };
  }

  const symbolsParam = event.queryStringParameters?.symbols || '';
  const requestedSymbols = symbolsParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (requestedSymbols.length === 0) {
    return {
      statusCode: 400,
      headers: allowedHeaders,
      body: JSON.stringify({ error: 'No symbols provided. Use ?symbols=SYM1,SYM2' }),
    };
  }

  // Range and interval: support 1d (intraday 5m) and 7d (daily closes)
  const rangeParam = event.queryStringParameters?.range || '7d';
  const range = rangeParam === '1d' ? '1d' : '7d';
  const interval = range === '1d' ? '5m' : '1d';

  // Ensure EURUSD=X is always requested for currency normalization
  const allSymbols = Array.from(new Set([...requestedSymbols, 'EURUSD=X']));

  const fetchHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  const results: Record<string, unknown> = {};

  await Promise.all(
    allSymbols.map(async (symbol) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
          symbol
        )}?range=${range}&interval=${interval}`;
        const res = await fetch(url, { headers: fetchHeaders });
        if (res.ok) {
          const data = (await res.json()) as YahooChartResult;
          if (data?.chart?.result?.[0]) {
            results[symbol] = data.chart.result[0];
          }
        }
      } catch (err) {
        console.error(`Failed to fetch ${symbol}:`, err);
      }
    })
  );

  // Extract EURUSD rate if present
  let eurUsdRate = 1.0825;
  const eurUsdData = results['EURUSD=X'] as { meta?: { regularMarketPrice?: number } } | undefined;
  if (eurUsdData?.meta?.regularMarketPrice && eurUsdData.meta.regularMarketPrice > 0) {
    eurUsdRate = eurUsdData.meta.regularMarketPrice;
  }

  return {
    statusCode: 200,
    headers: allowedHeaders,
    body: JSON.stringify({
      range,
      eurUsdRate,
      quotes: results,
      timestamp: Date.now(),
    }),
  };
}
