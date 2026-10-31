import type { RequestHandler } from 'express';
import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';

export type SubscriptionRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'CUSTOMER';
export type SubscriptionStatus = 'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'ACTIVE' | 'PAUSED' | 'CLOSED';
export type BillingPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface TenantTransaction {
  prisma: Prisma.TransactionClient;
  tenantId: string;
}

export interface ApplicableDiscount {
  discountId: string;
  kind: 'FIXED' | 'PERCENT';
  value: Prisma.Decimal;
  appliesTo: 'PRODUCTS' | 'SUBSCRIPTIONS';
  productIds: readonly string[];
}

export interface DueSubscription {
  id: string;
  number: bigint;
  customerId: string;
  planId: string;
  billingPeriod: BillingPeriod;
  nextInvoiceDate: Date;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface SubscriptionRequestContext {
  tenantId: string;
  actorId: string;
  role: SubscriptionRole;
  customerId?: string;
}

export interface SubscriptionRouteDependencies {
  prisma: PrismaClient;
  context: (request: Parameters<RequestHandler>[0]) => SubscriptionRequestContext;
  requireRole: (...roles: SubscriptionRole[]) => RequestHandler;
  can: (tenantId: string, feature: string) => Promise<boolean>;
  assertCustomerInTenant: (tenantId: string, customerId: string) => Promise<void>;
  paymentIsConfirmed: (tenantId: string, subscriptionId: string) => Promise<boolean>;
}

export const SUBSCRIPTIONS_FEATURE = 'subscriptions.management';
