import { WatchlistItem } from '../types';

export const STARTER_WATCHLIST: WatchlistItem[] = [
  // 1-5: ETFs (Amundi XETRA EUR)
  {
    id: '6TVM.DE',
    symbol: '6TVM.DE',
    name: 'Core S&P 500 USD (Dist)',
    category: 'ETF',
  },
  {
    id: 'LYPG.DE',
    symbol: 'LYPG.DE',
    name: 'MSCI World Info Tech USD (Acc)',
    category: 'ETF',
  },
  {
    id: 'F50A.DE',
    symbol: 'F50A.DE',
    name: 'MSCI World USD (Dist)',
    category: 'ETF',
  },
  {
    id: '6AQQ.DE',
    symbol: '6AQQ.DE',
    name: 'Nasdaq-100 EUR (Acc)',
    category: 'ETF',
  },
  {
    id: 'GOAI.DE',
    symbol: 'GOAI.DE',
    name: 'MSCI Robotics & AI USD (Acc)',
    category: 'ETF',
  },

  // 6-10: US Stocks (NASDAQ / NYSE, auto-converted USD -> EUR)
  {
    id: 'NVDA',
    symbol: 'NVDA',
    name: 'NVIDIA',
    category: 'US Stock',
  },
  {
    id: 'AMD',
    symbol: 'AMD',
    name: 'AMD',
    category: 'US Stock',
  },
  {
    id: 'GOOGL',
    symbol: 'GOOGL',
    name: 'Alphabet',
    category: 'US Stock',
  },
  {
    id: 'AMZN',
    symbol: 'AMZN',
    name: 'Amazon',
    category: 'US Stock',
  },
  {
    id: 'IBM',
    symbol: 'IBM',
    name: 'IBM',
    category: 'US Stock',
  },

  // 11-12: EU Stocks (XETRA EUR)
  {
    id: 'ENR.DE',
    symbol: 'ENR.DE',
    name: 'Siemens Energy',
    category: 'EU Stock',
  },
  {
    id: 'NOA3.DE',
    symbol: 'NOA3.DE',
    name: 'Nokia',
    category: 'EU Stock',
  },

  // 13-17: Popular Crypto (Direct EUR Pairs)
  {
    id: 'BTC-EUR',
    symbol: 'BTC-EUR',
    name: 'Bitcoin',
    category: 'Crypto',
  },
  {
    id: 'ETH-EUR',
    symbol: 'ETH-EUR',
    name: 'Ethereum',
    category: 'Crypto',
  },
  {
    id: 'SOL-EUR',
    symbol: 'SOL-EUR',
    name: 'Solana',
    category: 'Crypto',
  },
  {
    id: 'XRP-EUR',
    symbol: 'XRP-EUR',
    name: 'XRP',
    category: 'Crypto',
  },
  {
    id: 'ADA-EUR',
    symbol: 'ADA-EUR',
    name: 'Cardano',
    category: 'Crypto',
  },
];
