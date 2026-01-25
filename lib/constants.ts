// Application constants

export const ASSET_TYPES = {
  STOCK: 'stock',
  CRYPTO: 'crypto',
  FOREX: 'forex',
  COMMODITY: 'commodity',
} as const;

export type AssetType = typeof ASSET_TYPES[keyof typeof ASSET_TYPES];

export const EVENT_IMPORTANCE = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type EventImportance = typeof EVENT_IMPORTANCE[keyof typeof EVENT_IMPORTANCE];

export const NEWS_SOURCES = [
  'Bloomberg',
  'Reuters',
  'Wall Street Journal',
  'Financial Times',
  'CoinDesk',
  'Yahoo Finance',
] as const;

// API Configuration (Phase 2)
export const API_CONFIG = {
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  MARKET_DATA_ENDPOINT: '/api/market-data',
  NEWS_ENDPOINT: '/api/news',
  EVENTS_ENDPOINT: '/api/events',
} as const;

// UI Configuration
export const UI_CONFIG = {
  MAX_NEWS_ITEMS_DASHBOARD: 5,
  MAX_PORTFOLIO_ITEMS_DASHBOARD: 5,
  MAX_EVENTS_DASHBOARD: 5,
  DATE_FORMAT: 'MMM d, yyyy',
  TIME_FORMAT: 'h:mm a',
} as const;

// Color classes for reuse
export const COLOR_CLASSES = {
  SUCCESS: 'text-success',
  DANGER: 'text-danger',
  ACCENT: 'text-accent',
  MUTED: 'text-muted-foreground',
} as const;
