// TypeScript types for the Insights Module

export interface RevenueMetrics {
  activeSubscriptions: number;
  mrr: number;
  arr: number;
  revenueCollected: number;
  outstandingRevenue: number;
  revenueAtRisk: number;
  churnRate: number;
  growthRate: number;
}

export interface ForecastItem {
  month: string;
  projectedMrr: number;
  projectedArr: number;
  confidence: number;
}

export interface MonthlyTrendItem {
  month: string;
  collected: number;
  overdue: number;
  newMrr: number;
}

export interface TierBreakdownItem {
  tier: string;
  count: number;
  mrr: number;
  percentage: number;
}

export interface RevenueSummaryData {
  metrics: RevenueMetrics;
  forecast: ForecastItem[];
  monthlyTrend: MonthlyTrendItem[];
  tierBreakdown: TierBreakdownItem[];
  cachedAt: string;
  cacheTtlSeconds: number;
  executionTimeMs: number;
  totalSampledSubscriptions: number;
}

export interface CustomerHealthItem {
  id: string;
  companyName: string;
  contactEmail: string;
  tier: "Free" | "Standard" | "Custom";
  seats: number;
  healthScore: number;
  status: "healthy" | "at-risk" | "critical";
  paymentPunctuality: number;
  overdueCount: number;
  overdueAmount: number;
  seatGrowth: number;
  trend: "improving" | "stable" | "declining";
}

export interface CustomerHealthData {
  data: CustomerHealthItem[];
  totalCount: number;
  limit: number;
  offset: number;
  distribution: {
    healthy: number;
    atRisk: number;
    critical: number;
  };
}

export interface CustomizationItem {
  id: string;
  name: string;
  category: string;
  cost: number;
  slotCost: number;
  description: string;
  enabled: boolean;
  includedInTier: "Standard" | "Custom" | "None";
}

export interface CustomizationStudioData {
  catalog: CustomizationItem[];
  wallet: {
    balance: number;
    slotsUsed: number;
    totalSlots: number;
    bundlePrice5: number;
  };
}

export interface AskRevenueResponse {
  answer: string;
  suggestedActions: string[];
  metrics?: Record<string, string | number>;
}
