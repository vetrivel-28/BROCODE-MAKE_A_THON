import { z } from "zod";

// Schema for Revenue Summary query parameters
export const revenueSummaryQuerySchema = z.object({
  dateRange: z.enum(["30d", "90d", "6m", "1y", "all"]).default("30d"),
  tier: z.enum(["all", "free", "standard", "custom"]).default("all"),
  tenantId: z.string().optional().default("default-tenant"),
});

export type RevenueSummaryQuery = z.infer<typeof revenueSummaryQuerySchema>;

// Schema for Customer Health query parameters
export const customerHealthQuerySchema = z.object({
  status: z.enum(["all", "healthy", "at-risk", "critical"]).default("all"),
  search: z.string().optional().default(""),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  tenantId: z.string().optional().default("default-tenant"),
});

export type CustomerHealthQuery = z.infer<typeof customerHealthQuerySchema>;

// Schema for Customization purchase request
export const purchaseCustomizationSchema = z.object({
  customizationId: z.string().min(1, "Customization ID is required"),
  bundle: z.boolean().optional().default(false),
  tenantId: z.string().optional().default("default-tenant"),
});

export type PurchaseCustomizationInput = z.infer<typeof purchaseCustomizationSchema>;

// Schema for Ask Your Revenue natural language query
export const askRevenueQuerySchema = z.object({
  query: z.string().min(2, "Query must be at least 2 characters"),
  tenantId: z.string().optional().default("default-tenant"),
});

export type AskRevenueQueryInput = z.infer<typeof askRevenueQuerySchema>;
