import type { BillingPeriod, DueSubscription, Page, TenantTransaction } from './subscriptions.types.js';

export async function getDueSubscriptions(
  tx: TenantTransaction,
  asOf: Date,
  page: { take: number; cursor?: string },
): Promise<Page<DueSubscription>> {
  if (!Number.isInteger(page.take) || page.take < 1 || page.take > 100) {
    throw new RangeError('take must be an integer between 1 and 100');
  }
  const rows = await tx.prisma.subscription.findMany({
    where: {
      tenantId: tx.tenantId,
      status: 'ACTIVE',
      nextInvoiceDate: { lte: asOf },
    },
    orderBy: [{ nextInvoiceDate: 'asc' }, { id: 'asc' }],
    take: page.take + 1,
    ...(page.cursor ? { cursor: { tenantId_id: { tenantId: tx.tenantId, id: page.cursor } }, skip: 1 } : {}),
    include: { plan: { select: { billingPeriod: true } } },
  });
  const hasMore = rows.length > page.take;
  const items = (hasMore ? rows.slice(0, page.take) : rows).flatMap((subscription) =>
    subscription.nextInvoiceDate ? [{
      id: subscription.id,
      number: subscription.number,
      customerId: subscription.customerId,
      planId: subscription.planId,
      billingPeriod: subscription.plan.billingPeriod as BillingPeriod,
      nextInvoiceDate: subscription.nextInvoiceDate,
    }] : []);
  return { items, nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function addCalendarMonths(date: Date, count: number): Date {
  const result = new Date(date);
  const originalDay = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + count);
  result.setUTCDate(Math.min(originalDay, daysInMonth(result.getUTCFullYear(), result.getUTCMonth())));
  return result;
}

export function nextInvoiceDate(periodStart: Date, billingPeriod: BillingPeriod): Date {
  const date = new Date(periodStart);
  if (!Number.isFinite(date.getTime())) throw new RangeError('periodStart must be a valid date');
  switch (billingPeriod) {
    case 'DAILY':
      date.setUTCDate(date.getUTCDate() + 1);
      return date;
    case 'WEEKLY':
      date.setUTCDate(date.getUTCDate() + 7);
      return date;
    case 'MONTHLY':
      return addCalendarMonths(date, 1);
    case 'YEARLY':
      return addCalendarMonths(date, 12);
  }
}

export async function advanceNextInvoiceDate(
  tx: TenantTransaction,
  subscriptionId: string,
  periodStart: Date,
): Promise<Date> {
  const subscription = await tx.prisma.subscription.findFirst({
    where: { id: subscriptionId, tenantId: tx.tenantId },
    include: { plan: { select: { billingPeriod: true } } },
  });
  if (!subscription) throw new Error('Subscription not found in tenant');
  if (subscription.status !== 'ACTIVE') throw new Error('Only active subscriptions can advance invoice dates');
  const next = nextInvoiceDate(periodStart, subscription.plan.billingPeriod as BillingPeriod);
  await tx.prisma.subscription.update({
    where: { tenantId_id: { tenantId: tx.tenantId, id: subscriptionId } },
    data: { nextInvoiceDate: next },
  });
  return next;
}
