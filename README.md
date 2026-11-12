# FinPulse EUR · Multi-Asset Financial Watchlist PWA

A high-performance, dark-mode financial watchlist web application built as an installable **Progressive Web App (PWA)** to track European UCITS ETFs, US stocks, EU equities, and cryptocurrencies—with **all prices and metrics normalized to Euros (€)**.

Built 100% deterministic: fast, lightweight, and data-driven with zero AI overhead or LLM dependencies.

---

## Features

- **100% EUR Currency Normalization**:
  - Automatically fetches the live `EURUSD=X` exchange rate.
  - Automatically converts USD-denominated assets (e.g. NVIDIA, AMD, Alphabet) to EUR, displaying a subtle `USD → EUR` conversion badge.
  - Handles sub-unit currencies (e.g. GBp pence) and penny-asset precision.
- **Progressive Web App (PWA)**:
  - Installable directly to the home screen on Android, Chrome, and iOS Safari.
  - Launches in standalone fullscreen mode like a native application.
  - Offline-ready with local caching and offline status indicator.
  - In-app install banner with guided iOS Safari instructions.
- **Interactive Red / Green Heatmap Cards**:
  - Dynamic card background tint and border glow based on daily percentage change:
    - Vibrant emerald glow for gains $> +3.0\%$
    - Medium emerald border for $+1.0\%$ to $+3.0\%$
    - Subtle emerald tint for $0.0\%$ to $+1.0\%$
    - Subtle crimson tint for $0.0\%$ to $-1.0\%$
    - Medium crimson border for $-1.0\%$ to $-3.0\%$
    - Vibrant crimson glow for losses $< -3.0\%$
- **Dual Graph Timeframes (1D & 7D)**:
  - **1D**: Intraday price movements with hover price tooltips.
  - **7D**: 7-day daily close trajectory with SVG smooth curves and gradient fills.
  - Global toggle in the top bar or individual toggle on each asset card.
- **Market Session Clocks (CET)**:
  - Real-time market status badges calculated in Central European Time:
    - **XETRA** (Open Mon–Fri 09:00–17:30 CET)
    - **US Markets** (Open Mon–Fri 15:30–22:00 CET)
    - **Crypto** (24/7 Non-stop)
- **Dynamic Watchlist Management**:
  - **Debounced Search**: Search Yahoo Finance for tickers, company names, UCITS ETFs, or ISIN codes.
  - **Custom Ordering**: Reorder cards using intuitive Up/Down controls in Edit mode.
  - **Inline Editing**: Rename assets and change category tags on the fly.
  - **Backup & Sync**: Export your custom list to a `.json` file and import it on another device with zero cloud login required.
- **Smart Caching & Refresh Cadence**:
  - Automatically renders from `localStorage` on launch for instant zero-latency loads.
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
