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
  planId: string;
  status: SubscriptionStatus;
  startDate: string | null;
  expiryDate: string | null;
  nextInvoiceDate: string | null;
  quantity: number;
  paymentTerms: string;
  createdAt: string;
  plan: Plan;
  lines: SubscriptionLine[];
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
}
