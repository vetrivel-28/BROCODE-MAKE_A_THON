import { mockCatalogState } from '../catalog/mock.adapter';
import type { Plan, QuotationTemplate } from '../catalog/catalog.types';
import {
  calculateDiscountAmount,
  getDiscountPurchaseBase,
  isDiscountEligible,
} from '../../../../backend/src/modules/subscriptions/subscriptions.discount-logic';
import {
  resolveSubscriptionTransition,
} from '../../../../backend/src/modules/subscriptions/subscriptions.state-machine';
import { assertPlanSelectionAllowed } from '../../../../backend/src/modules/subscriptions/subscriptions.plan-guards';
import type { AuditEvent, Subscription, SubscriptionAction, SubscriptionPage, SubscriptionStatus } from './subscriptions.types';

const DAY = 86_400_000;
const customers = [
  'Aarav Mehta · BluePeak Labs',
  'Ananya Iyer · Kaveri Systems',
  'Ishaan Kapoor · Northstar Retail',
  'Diya Shah · Papertrail Finance',
  'Kabir Nair · GreenRoute Logistics',
  'Mira Reddy · Cedar & Co.',
  'Arjun Patel · BrightPath Health',
  'Saanvi Bose · Monsoon Digital',
  'Vivaan Rao · OrbitWorks',
  'Tara Menon · Silverline Foods',
];
const statuses: SubscriptionStatus[] = ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CLOSED'];
const currentDate = new Date();
const addDays = (date: Date, count: number) => new Date(date.getTime() + count * DAY);
const iso = (date: Date) => date.toISOString();
const planPolicy = (plan: Plan) => ({
  ...plan,
  availableFrom: plan.availableFrom ? new Date(plan.availableFrom) : null,
  availableUntil: plan.availableUntil ? new Date(plan.availableUntil) : null,
});

const subscriptions: Subscription[] = [];
const timelines = new Map<string, AuditEvent[]>();
const idempotencyKeys = new Map<string, { request: string; subscriptionId: string }>();
const transitionKeys = new Map<string, { subscriptionId: string; action: SubscriptionAction }>();

function makeEvents(subscriptionId: string, createdAt: string, statusIndex: number): AuditEvent[] {
  const eventTypes = ['CREATED', 'QUOTATION_CREATED', 'CONFIRMED', 'ACTIVATED', 'NOTE_ADDED', 'RENEWED', 'PAUSED', 'RESUMED'];
  const count = 3 + (statusIndex % 8);
  return Array.from({ length: count }, (_, index) => {
    const toStatus = statuses[Math.min(index, statusIndex)] ?? 'DRAFT';
    const priorStatus = index === 0 ? null : statuses[Math.min(index - 1, statusIndex)];
    return {
      id: `${subscriptionId}-event-${index}`,
      actorId: index === 0 ? null : 'usr-admin',
      eventType: eventTypes[index % eventTypes.length],
      fromStatus: priorStatus,
      toStatus,
      details: index === 0 ? { source: 'Quotation template' } : { demo: true },
      createdAt: iso(addDays(new Date(createdAt), index)),
    };
  }).reverse();
}

for (let index = 0; index < 60; index += 1) {
  const status = statuses[Math.floor(index / 10)];
  const plan = mockCatalogState.plans[index % mockCatalogState.plans.length];
  const startDate = addDays(currentDate, -90 + index);
  const quantity = index % 4 === 0 ? Math.max(plan.minimumQuantity, 5) : Math.max(plan.minimumQuantity, (index % 7) + 1);
  const lines = [{
    id: `sub-${index + 1}-line-1`,
    productId: index % 2 === 0 ? 'prd-onboarding' : 'prd-odoo',
    quantity: 1,
    unitPrice: index % 2 === 0 ? '7500.00' : '18500.00',
    taxRate: '18.00',
    taxAmount: index % 2 === 0 ? '1350.00' : '3330.00',
    amount: index % 2 === 0 ? '7500.00' : '18500.00',
    product: mockCatalogState.products[index % 2 === 0 ? 1 : 0],
  }];
  const baseAmount = Number(plan.price) * quantity + Number(lines[0].amount);
  const subscription: Subscription = {
    id: `sub-${String(index + 1).padStart(3, '0')}`,
    number: String(1001 + index),
    customerId: `cus-${(index % customers.length) + 1}`,
    customerName: customers[index % customers.length],
    planId: plan.id,
    status,
    startDate: iso(startDate),
    expiryDate: iso(addDays(startDate, status === 'CLOSED' ? 45 : 365)),
    nextInvoiceDate: iso(addDays(startDate, 30)),
    quantity,
    amount: baseAmount.toFixed(2),
    paymentTerms: index % 2 ? 'Net 15' : 'Due on receipt',
    createdAt: iso(addDays(startDate, -2)),
    plan,
    lines,
    appliedDiscounts: [],
  };
  subscriptions.push(subscription);
  timelines.set(subscription.id, makeEvents(subscription.id, subscription.createdAt, Math.max(0, statuses.indexOf(status))));
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function page<T>(items: T[], cursor?: string, take = 20) {
  const start = cursor ? Number(cursor) : 0;
  const slice = items.slice(start, start + take);
  return { items: clone(slice), nextCursor: start + take < items.length ? String(start + take) : null };
}

function event(
  eventType: string,
  fromStatus: SubscriptionStatus | null,
  toStatus: SubscriptionStatus | null,
  details: Record<string, unknown> | null = null,
): AuditEvent {
  return {
    id: `evt-${crypto.randomUUID()}`,
    actorId: 'usr-admin',
    eventType,
    fromStatus,
    toStatus,
    details,
    createdAt: new Date().toISOString(),
  };
}

function resolveDiscounts(subscription: Subscription, periodStart: Date) {
  const result: Subscription['appliedDiscounts'] = [];
  for (const rule of mockCatalogState.discounts) {
    const purchaseBase = getDiscountPurchaseBase(
      rule.appliesTo,
      rule.productIds,
      subscription.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        amount: line.amount,
      })),
      subscription.plan.price,
      subscription.quantity,
    );
    if (!purchaseBase) continue;
    if (!isDiscountEligible({
      startsAt: new Date(rule.startsAt),
      endsAt: rule.endsAt ? new Date(rule.endsAt) : null,
      usageLimit: rule.usageLimit,
      usageCount: rule.usageCount,
      minimumPurchase: rule.minimumPurchase,
      minimumQuantity: rule.minimumQuantity,
      periodStart,
      purchaseAmount: purchaseBase.purchaseAmount,
      quantity: purchaseBase.quantity,
    })) continue;
    result.push({
      discountId: rule.id,
      name: rule.name,
      kind: rule.kind,
      value: rule.value,
      amount: calculateDiscountAmount(purchaseBase.purchaseAmount, rule.kind, rule.value),
    });
  }
  return result;
}

function requireSubscription(id: string) {
  const subscription = subscriptions.find((item) => item.id === id);
  if (!subscription) throw new Error('Subscription not found');
  return subscription;
}

export const mockSubscriptionsApi = {
  async list(options: {
    cursor?: string;
    status?: SubscriptionStatus;
    search?: string;
    fromDate?: string;
    toDate?: string;
  } = {}): Promise<SubscriptionPage> {
    const matching = subscriptions.filter((subscription) => {
      const search = options.search?.trim().toLocaleLowerCase();
      const matchesStatus = !options.status || subscription.status === options.status;
      const matchesSearch = !search || `${subscription.number} ${subscription.customerName} ${subscription.plan.name}`.toLocaleLowerCase().includes(search);
      const date = subscription.startDate ? new Date(subscription.startDate).getTime() : 0;
      const from = options.fromDate ? new Date(options.fromDate).getTime() : Number.NEGATIVE_INFINITY;
      const to = options.toDate ? new Date(`${options.toDate}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
      return matchesStatus && matchesSearch && date >= from && date <= to;
    });
    const statusCounts = Object.fromEntries(statuses.map((status) => [
      status,
      subscriptions.filter((subscription) => subscription.status === status).length,
    ])) as Record<SubscriptionStatus, number>;
    return { ...page(matching, options.cursor, 20), statusCounts };
  },
  async details(id: string) {
    const subscription = requireSubscription(id);
    if (subscription.status === 'ACTIVE') {
      subscription.appliedDiscounts = resolveDiscounts(subscription, new Date(subscription.nextInvoiceDate ?? new Date()));
    }
    return clone(subscription);
  },
  async timeline(id: string, cursor?: string) {
    requireSubscription(id);
    return page(timelines.get(id) ?? [], cursor, 20);
  },
  async createFromTemplate(input: {
    idempotencyKey: string;
    templateId: string;
    customerId: string;
    startDate: string;
    expiryDate?: string | null;
    paymentTerms: string;
    quantity: number;
  }) {
    if (!input.idempotencyKey.trim()) throw new Error('Idempotency key is required');
    const requestFingerprint = JSON.stringify({
      templateId: input.templateId,
      customerId: input.customerId,
      startDate: input.startDate,
      expiryDate: input.expiryDate ?? null,
      paymentTerms: input.paymentTerms,
      quantity: input.quantity,
    });
    const prior = idempotencyKeys.get(input.idempotencyKey);
    if (prior) {
      if (prior.request !== requestFingerprint) throw new Error('Idempotency key was already used with a different subscription request');
      return clone(requireSubscription(prior.subscriptionId));
    }
    const template: QuotationTemplate | undefined = mockCatalogState.templates.find((item) => item.id === input.templateId);
    if (!template?.plan) throw new Error('Quotation template or its plan was not found');
    const startDate = new Date(input.startDate);
    assertPlanSelectionAllowed(planPolicy(template.plan), startDate, input.quantity);
    if (input.expiryDate && new Date(input.expiryDate) < startDate) {
      throw new Error('Expiry date must be on or after start date');
    }
    if (!input.customerId.trim() || !input.paymentTerms.trim()) throw new Error('Customer and payment terms are required');
    const lines = (template.lines ?? []).map((line, index) => ({
      id: `new-line-${crypto.randomUUID()}-${index}`,
      productId: line.productId,
      quantity: line.quantity * input.quantity,
      unitPrice: line.unitPrice,
      taxRate: line.taxRate,
      taxAmount: (Number(line.taxAmount) * input.quantity).toFixed(2),
      amount: (Number(line.amount) * input.quantity).toFixed(2),
      product: line.product,
    }));
    const amount = (Number(template.plan.price) * input.quantity
      + lines.reduce((sum, line) => sum + Number(line.amount) + Number(line.taxAmount), 0)).toFixed(2);
    const subscription: Subscription = {
      id: `sub-${crypto.randomUUID()}`,
      number: String(1061 + subscriptions.length),
      customerId: input.customerId,
      customerName: customers.find((name) => name.toLocaleLowerCase().includes(input.customerId.toLocaleLowerCase())) ?? input.customerId,
      planId: template.plan.id,
      status: 'QUOTATION',
      startDate: iso(startDate),
      expiryDate: input.expiryDate ? iso(new Date(input.expiryDate)) : null,
      nextInvoiceDate: iso(startDate),
      quantity: input.quantity,
      amount,
      paymentTerms: input.paymentTerms,
      createdAt: new Date().toISOString(),
      plan: template.plan,
      lines,
      appliedDiscounts: [],
    };
    subscriptions.unshift(subscription);
    idempotencyKeys.set(input.idempotencyKey, { request: requestFingerprint, subscriptionId: subscription.id });
    timelines.set(subscription.id, [event('QUOTATION_CREATED', 'DRAFT', 'QUOTATION', { templateId: template.id })]);
    return clone(subscription);
  },
  async transition(id: string, action: SubscriptionAction, dates: {
    startDate?: string;
    expiryDate?: string;
    quotationExpiresAt?: string;
    idempotencyKey?: string;
  } = {}) {
    const subscription = requireSubscription(id);
    if (dates.idempotencyKey) {
      const prior = transitionKeys.get(dates.idempotencyKey);
      if (prior) {
        if (prior.subscriptionId !== id || prior.action !== action) {
          throw new Error('Idempotency key was already used for a different action');
        }
        return clone(subscription);
      }
    }
    const now = new Date();
    const expiry = subscription.expiryDate ? new Date(subscription.expiryDate) : null;
    const isExpired = expiry !== null && expiry < now;
    if (action === 'activate' && subscription.startDate) {
      assertPlanSelectionAllowed(planPolicy(subscription.plan), new Date(subscription.startDate), subscription.quantity, new Date(0));
    }
    resolveSubscriptionTransition(subscription.status, action, {
      role: 'ADMIN',
      actorOwnsSubscription: true,
      quotationIsValid: action === 'submitQuotation' || action === 'confirm'
        ? !dates.quotationExpiresAt || new Date(dates.quotationExpiresAt) > now
        : undefined,
      planAvailable: true,
      minimumQuantityMet: subscription.quantity >= subscription.plan.minimumQuantity,
      paymentConfirmed: action === 'activate' ? true : undefined,
      startDateValid: action === 'activate'
        ? Boolean(subscription.startDate && new Date(subscription.startDate) <= now)
        : undefined,
      planPausable: subscription.plan.pausable,
      planClosable: subscription.plan.closable,
      planRenewable: subscription.plan.renewable,
      planAutoClose: subscription.plan.autoClose,
      isExpired,
    });
    const from = subscription.status;
    if (action === 'submitQuotation') subscription.status = 'QUOTATION';
    if (action === 'confirm') subscription.status = 'CONFIRMED';
    if (action === 'activate') subscription.status = 'ACTIVE';
    if (action === 'pause') subscription.status = 'PAUSED';
    if (action === 'resume') subscription.status = 'ACTIVE';
    if (action === 'close') subscription.status = 'CLOSED';
    if (action === 'renew') {
      const base = expiry && expiry > now ? expiry : now;
      const renewedUntil = new Date(base);
      if (subscription.plan.billingPeriod === 'YEARLY') renewedUntil.setFullYear(renewedUntil.getFullYear() + 1);
      else if (subscription.plan.billingPeriod === 'WEEKLY') renewedUntil.setDate(renewedUntil.getDate() + 7);
      else if (subscription.plan.billingPeriod === 'DAILY') renewedUntil.setDate(renewedUntil.getDate() + 1);
      else renewedUntil.setMonth(renewedUntil.getMonth() + 1);
      subscription.expiryDate = iso(renewedUntil);
    }
    if (dates.startDate) subscription.startDate = dates.startDate;
    if (dates.expiryDate) subscription.expiryDate = dates.expiryDate;
    subscription.appliedDiscounts = subscription.status === 'ACTIVE'
      ? resolveDiscounts(subscription, new Date(subscription.nextInvoiceDate ?? now))
      : [];
    const auditEvent = event(action.toUpperCase(), from, subscription.status, { idempotencyKey: dates.idempotencyKey ?? null });
    timelines.set(id, [auditEvent, ...(timelines.get(id) ?? [])]);
    if (dates.idempotencyKey) transitionKeys.set(dates.idempotencyKey, { subscriptionId: id, action });
    return clone(subscription);
  },
  async applicableDiscounts(id: string, periodStart: string) {
    const subscription = requireSubscription(id);
    const start = new Date(periodStart);
    if (!Number.isFinite(start.getTime())) throw new Error('periodStart must be a valid date');
    if (subscription.status !== 'ACTIVE') throw new Error('Discounts can only be evaluated for active subscriptions');
    subscription.appliedDiscounts = resolveDiscounts(subscription, start);
    return clone(subscription.appliedDiscounts);
  },
};
