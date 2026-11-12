import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Dev proxy plugin to emulate Netlify functions inside Vite development server
function devApiProxyPlugin(): Plugin {
  return {
    name: 'dev-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();

        // 1. /api/quotes endpoint
        if (req.url.startsWith('/api/quotes')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const symbolsParam = urlObj.searchParams.get('symbols') || '';
            const requestedSymbols = symbolsParam
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);

            if (requestedSymbols.length === 0) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'No symbols provided' }));
              return;
            }

            const rangeParam = urlObj.searchParams.get('range') || '7d';
            const range = rangeParam === '1d' ? '1d' : '7d';
            const interval = range === '1d' ? '5m' : '1d';

            const allSymbols = Array.from(new Set([...requestedSymbols, 'EURUSD=X']));
            const headers = {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              Accept: 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
            };

            const quotes: Record<string, unknown> = {};

            await Promise.all(
              allSymbols.map(async (symbol) => {
                try {
                  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
                    symbol
                  )}?range=${range}&interval=${interval}`;
                  const yRes = await fetch(yahooUrl, { headers });
                  if (yRes.ok) {
                    const data = (await yRes.json()) as { chart?: { result?: unknown[] } };
                    if (data?.chart?.result?.[0]) {
                      quotes[symbol] = data.chart.result[0];
                    }
                  }
                } catch (err) {
                  console.error(`Dev proxy fetch failed for ${symbol}:`, err);
                }
              })
            );

            let eurUsdRate = 1.08;
            const eurUsdData = quotes['EURUSD=X'] as { meta?: { regularMarketPrice?: number } } | undefined;
            if (eurUsdData?.meta?.regularMarketPrice && eurUsdData.meta.regularMarketPrice > 0) {
              eurUsdRate = eurUsdData.meta.regularMarketPrice;
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ eurUsdRate, quotes, timestamp: Date.now() }));
            return;
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: msg }));
            return;
          }
        }

        // 2. /api/search endpoint
        if (req.url.startsWith('/api/search')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const q = urlObj.searchParams.get('q') || '';
            if (!q.trim()) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ quotes: [] }));
              return;
            }

            const headers = {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              Accept: 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
            };

            const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
              q
            )}&quotesCount=10&newsCount=0`;
            const yRes = await fetch(searchUrl, { headers });
            if (!yRes.ok) {
              throw new Error(`Yahoo Search returned status ${yRes.status}`);
            }
            const data = await yRes.json();

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify(data));
            return;
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Search failed', details: msg }));
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      devApiProxyPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          id: '/',
          name: 'FinPulse EUR - Market Terminal',
          short_name: 'FinPulseEUR',
          description: 'Dark-mode personal financial watchlist PWA tracking stocks, UCITS ETFs, and crypto normalized to EUR.',
          theme_color: '#090D16',
          background_color: '#090D16',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
