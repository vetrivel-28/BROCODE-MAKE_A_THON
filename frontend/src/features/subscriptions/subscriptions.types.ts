import type { Plan, Product } from '../catalog/catalog.types';

export type SubscriptionStatus = 'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'ACTIVE' | 'PAUSED' | 'CLOSED';
export type SubscriptionAction = 'submitQuotation' | 'confirm' | 'activate' | 'pause' | 'resume' | 'renew' | 'close';

export interface SubscriptionLine {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  taxRate: string;
  taxAmount: string;
  amount: string;
  product?: Product;
}

export interface Subscription {
  id: string;
  number: string;
  customerId: string;
  customerName?: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string | null;
  expiryDate: string | null;
  nextInvoiceDate: string | null;
  quantity: number;
  amount?: string;
  paymentTerms: string;
  createdAt: string;
  plan: Plan;
  lines: SubscriptionLine[];
  appliedDiscounts?: Array<{
    discountId: string;
    name: string;
    kind: 'FIXED' | 'PERCENT';
    value: string;
    amount: string;
  }>;
}

export interface AuditEvent {
  id: string;
  actorId: string | null;
  eventType: string;
  fromStatus: SubscriptionStatus | null;
  toStatus: SubscriptionStatus | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditEventPage {
  items: AuditEvent[];
  nextCursor: string | null;
}

export interface SubscriptionPage {
  items: Subscription[];
  nextCursor: string | null;
  statusCounts?: Record<SubscriptionStatus, number>;
}
