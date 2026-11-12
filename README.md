# FinPulse EUR · Multi-Asset Financial Watchlist PWA

A high-performance, dark-mode personal financial watchlist web application built as an installable **Progressive Web App (PWA)** to track European UCITS ETFs, US stocks, EU equities, and cryptocurrencies—with **all prices and key metrics normalized to Euros (€)**.

Built 100% deterministic: fast, lightweight, and data-driven with zero AI overhead or LLM dependencies.

---

## Features

- **100% EUR Currency Normalization**:
  - Automatically fetches the live `EURUSD=X` exchange rate.
  - Converts USD-denominated assets (e.g. NVIDIA, AMD, Alphabet) to EUR in real time, displaying an informative `USD → EUR` badge.
  - Handles sub-unit currencies (e.g. GBp pence) and penny-asset precision.
- **Progressive Web App (PWA)**:
  - Installable directly to the home screen on Android, Chrome, and iOS Safari.
  - Launches in standalone fullscreen mode like a native mobile app.
  - Offline-ready with local caching and non-intrusive offline status toast.
  - In-app install banner with guided iOS Safari home screen instructions.
- **Adaptive Header with Zero Lost Headroom**:
  - **Full Details at Top**: View all market sessions, live EUR/USD rate, auto-refresh cadence, last updated timestamp, and action buttons when at the top of the page.
  - **Minimal 42px Bar on Scroll**: As you scroll down, the header naturally collapses into an ultra-slim 42px minimal bar (`FinPulse EUR` · `EUR/USD` · `+ Add` · `Edit` · `Refresh`), reclaiming virtually 100% of the mobile screen for your watchlist cards.
  - **Tap to Expand**: Tapping the top brand title at any time smoothly scrolls to the top and immediately restores the full expanded header.
- **Dual Graph Timeframes (1D & 7D) with Dynamic Period Metrics**:
  - **1D (Intraday)**: High-resolution intraday curve with clean hourly hover tags (e.g., `€323,69 · 14:30`).
  - **7D (Weekly Trend)**: 7-day daily close trajectory with short weekday hover tags (e.g., `€323,69 · Wed`).
  - **Dynamic Period Percentage & Euro Delta**:
    - Switching between 1D and 7D instantly updates the percentage badge, euro change (`today` vs `past 7d`), and the card's heatmap glow.
    - Top Gainers / Losers sorting and market breadth stats automatically calculate against the active timeframe.
- **Interactive Red / Green Heatmap Cards**:
  - Dynamic card background tint and border glow based on selected period performance:
    - Vibrant emerald glow for gains $> +3.0\%$
    - Medium emerald border for $+1.0\%$ to $+3.0\%$
    - Subtle emerald tint for $0.0\%$ to $+1.0\%$
    - Subtle crimson tint for $0.0\%$ to $-1.0\%$
    - Medium crimson border for $-1.0\%$ to $-3.0\%$
    - Vibrant crimson glow for losses $< -3.0\%$
- **Market Session Clocks (CET)**:
  - Real-time market status badges calculated in Central European Time:
    - **XETRA** (Open Mon–Fri 09:00–17:30 CET)
    - **US Markets** (Open Mon–Fri 15:30–22:00 CET)
    - **Crypto** (24/7 Non-stop)
- **Safe & Dynamic Watchlist Management**:
  - **Debounced Search**: Search Yahoo Finance for tickers, company names, UCITS ETFs, or ISIN codes.
  - **Custom Ordering**: Reorder cards using intuitive Up/Down controls in Edit mode.
  - **Inline Editing**: Rename assets and customize category tags on the fly.
  - **Backup & Sync**: Export your custom list to a `.json` file and import it on another device without any risk of accidental resets.
- **Smart Caching & Refresh Cadence**:
  - Renders from `localStorage` on launch for instant zero-latency loads.
  - Configurable auto-refresh interval (`Every 1 hour`, `Every 2 hours`, or `Manual only`).
  - Manual refresh button with loading spinner and CET last-updated timestamp.

---

## Pre-Loaded Starter Watchlist

| Category | Symbols | Description |
| :--- | :--- | :--- |
| **ETFs (XETRA EUR)** | `6TVM.DE`, `LYPG.DE`, `F50A.DE`, `6AQQ.DE`, `GOAI.DE` | Amundi Core S&P 500, MSCI World IT, MSCI World, Nasdaq-100, Robotics & AI |
| **US Stocks (USD → EUR)** | `NVDA`, `AMD`, `GOOGL`, `AMZN`, `IBM` | Tech leaders auto-converted to EUR |
| **EU Stocks (XETRA EUR)** | `ENR.DE`, `NOA3.DE` | Siemens Energy, Nokia |
| **Crypto (EUR Pairs)** | `BTC-EUR`, `ETH-EUR`, `SOL-EUR`, `XRP-EUR`, `ADA-EUR` | Bitcoin, Ethereum, Solana, XRP, Cardano |

---

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/) + [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Typography**: Plus Jakarta Sans & JetBrains Mono (tabular figures)
- **Backend / Serverless**: Netlify Functions (`netlify/functions/quotes.ts` and `search.ts`) with local Vite dev proxy and public CORS fallback

---

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/finpulse-eur.git
   cd finpulse-eur
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

4. Build for production:
   ```bash
   npm run build
   ```

---

## Deployment to Netlify

The repository includes a ready-to-use `netlify.toml` and serverless functions in `netlify/functions/`:

1. Push this repository to GitHub or GitLab.
2. Link the repository in your [Netlify Dashboard](https://app.netlify.com/).
3. Netlify will automatically detect:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Functions Directory**: `netlify/functions`
4. Deploy! Your API endpoints at `/api/quotes` and `/api/search` will be handled by the serverless functions with zero additional configuration.

---

## Security & Privacy Notice

- **Zero Secrets**: This application does **not** use or require any paid API keys, tokens, or private secrets.
- **Zero Telemetry**: No third-party analytics trackers, cookies, or tracking scripts are included.
- **Safe for Public Repositories**: You can safely publish this repository as **Public** on GitHub without exposing any credentials or private information.

---

## License

Apache-2.0 License.
