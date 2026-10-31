import { clock } from '../../common/clock.js';
import { AppError } from '../../common/errors.js';

export type SubscriptionStatus = 'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'ACTIVE' | 'CLOSED';

export interface SubscriptionItem {
  id: string;
  tenantId: string;
  subscriptionNumber: string;
  customerName: string;
  customerEmail: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  startDate: Date;
  expiryDate?: Date;
  paymentTermsDays: number;
  nextInvoiceDate: Date;
  lines: Array<{
    id: string;
    productId: string;
    productName: string;
    variantName?: string;
    quantity: number;
    unitPricePaise: number;
    taxPercent: number;
    amountPaise: number;
  }>;
  appliedDiscountId?: string;
  discountPaise: number;
  subtotalPaise: number;
  taxPaise: number;
  totalPaise: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountRule {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  type: 'PERCENT' | 'FIXED';
  value: number; // e.g. 20 for 20%, or 50000 paise for Rs 500
  appliesTo: 'ALL' | 'PRODUCT';
  productId?: string;
  minPurchasePaise: number;
  minQuantity: number;
  usageLimit: number;
  usedCount: number;
  startDate?: Date;
  endDate?: Date;
}

export interface AuditEventItem {
  id: string;
  subscriptionId: string;
  tenantId: string;
  type: string;
  title: string;
  description: string;
  createdAt: Date;
}

const subscriptionsStore: SubscriptionItem[] = [];
const discountsStore: DiscountRule[] = [];
const auditEventsStore: AuditEventItem[] = [];

let subCounter = 1000;

function seedInitialSubscriptions() {
  if (subscriptionsStore.length > 0) return;

  const defaultTenant = 'a7ca59cb-8de8-4b03-aee4-d52bb09488b3';
  const now = clock.now();

  // Smart Discount seed: 15% Welcome Saver & Growth Tier
  discountsStore.push({
    id: 'disc-welcome-15',
    tenantId: defaultTenant,
    code: 'WELCOME15',
    name: '15% New Customer Incentive',
    type: 'PERCENT',
    value: 15,
    appliesTo: 'ALL',
    minPurchasePaise: 0,
    minQuantity: 1,
    usageLimit: 50,
    usedCount: 3
  });

  discountsStore.push({
    id: 'disc-seat-booster',
    tenantId: defaultTenant,
    code: 'SCALE500',
    name: 'Seat Expansion Voucher',
    type: 'FIXED',
    value: 50000, // Rs 500 = 50,000 paise
    appliesTo: 'ALL',
    minPurchasePaise: 200000,
    minQuantity: 3,
    usageLimit: 100,
    usedCount: 12
  });

  // Seed Demo Active Subscription
  const subId = 'sub-seed-001';
  subscriptionsStore.push({
    id: subId,
    tenantId: defaultTenant,
    subscriptionNumber: 'SUB-2026-1001',
    customerName: 'NexGen Cloud Services',
    customerEmail: 'billing@nexgen.io',
    planId: 'plan-monthly-pro',
    planName: 'Professional Monthly',
    status: 'ACTIVE',
    startDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
    paymentTermsDays: 15,
    nextInvoiceDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
    lines: [
      {
        id: 'line-1',
        productId: 'prod-saas-core',
        productName: 'LoopDesk Enterprise Suite',
        variantName: 'Brand Odoo Integration',
        quantity: 1,
        unitPricePaise: 555900,
        taxPercent: 18,
        amountPaise: 555900
      }
    ],
    discountPaise: 0,
    subtotalPaise: 555900,
    taxPaise: 100062,
    totalPaise: 655962, // Rs 6,559.62
    createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
    updatedAt: now
  });

  auditEventsStore.push({
    id: 'aud-1',
    subscriptionId: subId,
    tenantId: defaultTenant,
    type: 'CREATED',
    title: 'Quotation Generated',
    description: 'Quotation initialized for NexGen Cloud Services with Brand Odoo variant.',
    createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)
  });

  auditEventsStore.push({
    id: 'aud-2',
    subscriptionId: subId,
    tenantId: defaultTenant,
    type: 'ACTIVATED',
    title: 'Subscription Activated',
    description: 'Contract confirmed and transitioned to ACTIVE billing schedule.',
    createdAt: new Date(now.getTime() - 44 * 24 * 60 * 60 * 1000)
  });
}

seedInitialSubscriptions();

export class SubscriptionsService {
  constructor() {
    seedInitialSubscriptions();
  }

  public listSubscriptions(tenantId: string) {
    seedInitialSubscriptions();
    return subscriptionsStore.filter((s) => s.tenantId === tenantId || s.tenantId === 'a7ca59cb-8de8-4b03-aee4-d52bb09488b3');
  }

  public getSubscription(id: string, tenantId: string) {
    const sub = subscriptionsStore.find((s) => s.id === id);
    if (!sub) throw new AppError(404, 'NOT_FOUND', 'Subscription not found');
    const timeline = auditEventsStore.filter((a) => a.subscriptionId === id);
    return { ...sub, timeline };
  }

  public createSubscription(tenantId: string, data: any) {
    seedInitialSubscriptions();
    subCounter++;
    const subNumber = `SUB-2026-${subCounter}`;
    const now = clock.now();

    const lines = (data.lines || []).map((l: any, idx: number) => {
      const qty = Number(l.quantity) || 1;
      const unitPaise = Math.round((Number(l.unitPriceInr) || 0) * 100);
      const taxPct = Number(l.taxPercent) || 18;
      const lineTotal = qty * unitPaise;
      return {
        id: `sline-${Date.now()}-${idx}`,
        productId: l.productId || 'prod-custom',
        productName: l.productName || 'Service Item',
        variantName: l.variantName,
        quantity: qty,
        unitPricePaise: unitPaise,
        taxPercent: taxPct,
        amountPaise: lineTotal
      };
    });

    const subtotal = lines.reduce((acc: number, l: any) => acc + l.amountPaise, 0);
    const taxPaise = Math.round((subtotal * 18) / 100);
    const totalPaise = subtotal + taxPaise;

    const sub: SubscriptionItem = {
      id: `sub-${Date.now()}`,
      tenantId,
      subscriptionNumber: subNumber,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      planId: data.planId || 'plan-monthly-pro',
      planName: data.planName || 'Monthly Subscription',
      status: 'QUOTATION', // Initial status
      startDate: now,
      paymentTermsDays: data.paymentTermsDays || 15,
      nextInvoiceDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      lines,
      discountPaise: 0,
      subtotalPaise: subtotal,
      taxPaise,
      totalPaise,
      createdAt: now,
      updatedAt: now
    };

    subscriptionsStore.unshift(sub);

    // Record creation event in Subscription Timeline
    auditEventsStore.unshift({
      id: `aud-${Date.now()}`,
      subscriptionId: sub.id,
      tenantId,
      type: 'QUOTATION',
      title: 'Quotation Created',
      description: `Draft quotation ${subNumber} issued for ${sub.customerName}.`,
      createdAt: now
    });

    return sub;
  }

  public updateStatus(id: string, newStatus: SubscriptionStatus, tenantId: string) {
    const sub = subscriptionsStore.find((s) => s.id === id);
    if (!sub) throw new AppError(404, 'NOT_FOUND', 'Subscription not found');

    const previousStatus = sub.status;
    sub.status = newStatus;
    sub.updatedAt = clock.now();

    // Timeline audit event
    auditEventsStore.unshift({
      id: `aud-${Date.now()}`,
      subscriptionId: sub.id,
      tenantId,
      type: newStatus,
      title: `Status Changed to ${newStatus}`,
      description: `Transitioned status from ${previousStatus} to ${newStatus}.`,
      createdAt: clock.now()
    });

    return sub;
  }

  // Smart Discount Engine
  public listDiscounts(tenantId: string) {
    seedInitialSubscriptions();
    return discountsStore.filter((d) => d.tenantId === tenantId || d.tenantId === 'a7ca59cb-8de8-4b03-aee4-d52bb09488b3');
  }

  public createDiscount(tenantId: string, data: any) {
    const discount: DiscountRule = {
      id: `disc-${Date.now()}`,
      tenantId,
      code: (data.code || 'DISCOUNT').toUpperCase(),
      name: data.name,
      type: data.type || 'PERCENT',
      value: data.type === 'PERCENT' ? Number(data.value) : Math.round(Number(data.value) * 100),
      appliesTo: data.appliesTo || 'ALL',
      minPurchasePaise: Math.round((Number(data.minPurchaseInr) || 0) * 100),
      minQuantity: Number(data.minQuantity) || 1,
      usageLimit: Number(data.usageLimit) || 100,
      usedCount: 0
    };
    discountsStore.unshift(discount);
    return discount;
  }

  // Seat growth discount suggestion
  public getSeatSuggestion(seats: number) {
    if (seats >= 5) {
      return {
        suggestedDiscountCode: 'SCALE500',
        message: 'High growth detected! 5+ seats qualifies for ₹500 discount voucher.'
      };
    }
    return null;
  }
}
