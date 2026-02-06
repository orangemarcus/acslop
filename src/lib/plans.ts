export interface PlanConfig {
  name: string;
  slug: 'free' | 'pro';
  monthlyPrice: number; // in dollars
  translationsPerMonth: number;
  maxTextLength: number;
  maxImageSize: number; // bytes
  bulkMode: boolean;
  priorityProcessing: boolean;
  shareableReports: boolean;
  exportFormats: boolean;
  dashboardAccess: boolean;
  stripePriceId: string | null;
}

export const PLANS: Record<string, PlanConfig> = {
  free: {
    name: 'Free',
    slug: 'free',
    monthlyPrice: 0,
    translationsPerMonth: 25,
    maxTextLength: 5000,
    maxImageSize: 5 * 1024 * 1024,
    bulkMode: false,
    priorityProcessing: false,
    shareableReports: true,
    exportFormats: true,
    dashboardAccess: true,
    stripePriceId: null,
  },
  pro: {
    name: 'Pro',
    slug: 'pro',
    monthlyPrice: 9,
    translationsPerMonth: 200,
    maxTextLength: 15000,
    maxImageSize: 10 * 1024 * 1024,
    bulkMode: true,
    priorityProcessing: true,
    shareableReports: true,
    exportFormats: true,
    dashboardAccess: true,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || null,
  },
};

export function getPlan(slug: string): PlanConfig {
  return PLANS[slug] || PLANS.free;
}

export const ANON_DAILY_LIMIT = 5;
