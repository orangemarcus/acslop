// Mock data for initial UI development (Phase 1)

export interface Position {
  id: string;
  ticker: string;
  name: string;
  assetType: 'stock' | 'crypto' | 'forex' | 'commodity';
  quantity: number;
  currentPrice: number;
  change: number;
  changePercent: number;
  value: number;
  purchasePrice?: number;
  purchaseDate?: string;
}

export interface MarketData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  relevantTickers: string[];
  excerpt?: string;
}

export interface EconomicEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  importance: 'low' | 'medium' | 'high';
  description?: string;
  affectedAssets: string[];
}

// Mock Portfolio Positions
export const mockPositions: Position[] = [
  {
    id: '1',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    assetType: 'stock',
    quantity: 50,
    currentPrice: 178.25,
    change: 2.15,
    changePercent: 1.22,
    value: 8912.50,
    purchasePrice: 165.00,
    purchaseDate: '2024-09-15',
  },
  {
    id: '2',
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    assetType: 'stock',
    quantity: 30,
    currentPrice: 425.18,
    change: -3.42,
    changePercent: -0.80,
    value: 12755.40,
    purchasePrice: 380.00,
    purchaseDate: '2024-08-20',
  },
  {
    id: '3',
    ticker: 'BTC',
    name: 'Bitcoin',
    assetType: 'crypto',
    quantity: 0.5,
    currentPrice: 42850.00,
    change: 1250.00,
    changePercent: 3.00,
    value: 21425.00,
    purchasePrice: 38000.00,
    purchaseDate: '2024-10-01',
  },
  {
    id: '4',
    ticker: 'ETH',
    name: 'Ethereum',
    assetType: 'crypto',
    quantity: 5,
    currentPrice: 2285.50,
    change: -45.30,
    changePercent: -1.94,
    value: 11427.50,
    purchasePrice: 2100.00,
    purchaseDate: '2024-10-01',
  },
  {
    id: '5',
    ticker: 'GOLD',
    name: 'Gold',
    assetType: 'commodity',
    quantity: 10,
    currentPrice: 2042.50,
    change: 15.75,
    changePercent: 0.78,
    value: 20425.00,
    purchasePrice: 1950.00,
    purchaseDate: '2024-07-10',
  },
  {
    id: '6',
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    assetType: 'stock',
    quantity: 25,
    currentPrice: 495.25,
    change: 12.80,
    changePercent: 2.65,
    value: 12381.25,
    purchasePrice: 420.00,
    purchaseDate: '2024-06-15',
  },
];

// Mock Market Indices
export const mockMarketData: MarketData[] = [
  {
    ticker: 'SPX',
    name: 'S&P 500',
    price: 4783.45,
    change: 23.15,
    changePercent: 0.49,
    lastUpdated: new Date().toISOString(),
  },
  {
    ticker: 'DJI',
    name: 'Dow Jones',
    price: 37305.16,
    change: -45.20,
    changePercent: -0.12,
    lastUpdated: new Date().toISOString(),
  },
  {
    ticker: 'IXIC',
    name: 'NASDAQ',
    price: 14813.92,
    change: 85.34,
    changePercent: 0.58,
    lastUpdated: new Date().toISOString(),
  },
  {
    ticker: 'VIX',
    name: 'Volatility Index',
    price: 13.45,
    change: -0.82,
    changePercent: -5.75,
    lastUpdated: new Date().toISOString(),
  },
];

// Mock News Articles
export const mockNews: NewsArticle[] = [
  {
    id: '1',
    title: 'Fed Signals Cautious Approach to Rate Cuts in 2025',
    source: 'Bloomberg',
    url: '#',
    publishedAt: '2026-01-24T14:30:00Z',
    relevantTickers: ['SPX', 'DJI', 'GOLD'],
    excerpt: 'Federal Reserve officials indicated they will proceed carefully with interest rate cuts this year, citing persistent inflation concerns.',
  },
  {
    id: '2',
    title: 'Apple Reports Record iPhone Sales in Q4 2025',
    source: 'Reuters',
    url: '#',
    publishedAt: '2026-01-24T12:15:00Z',
    relevantTickers: ['AAPL'],
    excerpt: 'Apple Inc. exceeded analyst expectations with strong iPhone 16 sales, driving revenue growth across all segments.',
  },
  {
    id: '3',
    title: 'Bitcoin ETF Inflows Surge to $2B in January',
    source: 'CoinDesk',
    url: '#',
    publishedAt: '2026-01-24T10:45:00Z',
    relevantTickers: ['BTC'],
    excerpt: 'Bitcoin spot ETFs saw record inflows this month as institutional investors increased crypto allocations.',
  },
  {
    id: '4',
    title: 'Microsoft Expands AI Infrastructure Investment',
    source: 'Financial Times',
    url: '#',
    publishedAt: '2026-01-24T09:20:00Z',
    relevantTickers: ['MSFT'],
    excerpt: 'Microsoft announces $10B investment in new AI data centers globally, strengthening its position in the AI race.',
  },
  {
    id: '5',
    title: 'NVIDIA Partners with Major Auto Manufacturers for AI Chips',
    source: 'Wall Street Journal',
    url: '#',
    publishedAt: '2026-01-23T16:00:00Z',
    relevantTickers: ['NVDA'],
    excerpt: 'NVIDIA secures partnerships with three major automakers to supply AI chips for next-generation autonomous vehicles.',
  },
  {
    id: '6',
    title: 'Gold Prices Rise on Global Economic Uncertainty',
    source: 'Reuters',
    url: '#',
    publishedAt: '2026-01-23T13:30:00Z',
    relevantTickers: ['GOLD'],
    excerpt: 'Gold futures climbed to six-month highs as investors seek safe-haven assets amid geopolitical tensions.',
  },
];

// Mock Economic Events
export const mockEvents: EconomicEvent[] = [
  {
    id: '1',
    title: 'FOMC Meeting',
    date: '2026-01-31',
    time: '14:00',
    importance: 'high',
    description: 'Federal Reserve monetary policy decision',
    affectedAssets: ['USD', 'bonds', 'stocks'],
  },
  {
    id: '2',
    title: 'US Jobs Report',
    date: '2026-02-07',
    time: '08:30',
    importance: 'high',
    description: 'Non-farm payrolls and unemployment rate',
    affectedAssets: ['USD', 'stocks'],
  },
  {
    id: '3',
    title: 'Apple Earnings Call',
    date: '2026-02-01',
    time: '16:30',
    importance: 'medium',
    description: 'Q1 2026 earnings report',
    affectedAssets: ['AAPL', 'tech-stocks'],
  },
  {
    id: '4',
    title: 'CPI Release',
    date: '2026-02-13',
    time: '08:30',
    importance: 'high',
    description: 'Consumer Price Index (inflation data)',
    affectedAssets: ['USD', 'bonds', 'stocks', 'GOLD'],
  },
  {
    id: '5',
    title: 'ECB Policy Decision',
    date: '2026-02-06',
    time: '12:45',
    importance: 'medium',
    description: 'European Central Bank interest rate decision',
    affectedAssets: ['EUR', 'EUR/USD'],
  },
];

// Helper functions
export function calculatePortfolioTotal(): number {
  return mockPositions.reduce((sum, position) => sum + position.value, 0);
}

export function calculatePortfolioDayChange(): { amount: number; percent: number } {
  const totalValue = calculatePortfolioTotal();
  const dayChange = mockPositions.reduce(
    (sum, position) => sum + (position.change * position.quantity),
    0
  );
  const dayChangePercent = (dayChange / (totalValue - dayChange)) * 100;

  return {
    amount: dayChange,
    percent: dayChangePercent,
  };
}

export function calculatePortfolioPnL(): { amount: number; percent: number } | null {
  let totalCost = 0;
  let totalValue = 0;
  let hasData = false;

  mockPositions.forEach((position) => {
    if (position.purchasePrice) {
      hasData = true;
      totalCost += position.purchasePrice * position.quantity;
      totalValue += position.value;
    }
  });

  if (!hasData) return null;

  const pnl = totalValue - totalCost;
  const pnlPercent = (pnl / totalCost) * 100;

  return {
    amount: pnl,
    percent: pnlPercent,
  };
}
