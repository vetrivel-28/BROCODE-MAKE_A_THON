import { Prisma } from '../../generated/prisma/client.js';
import type { ApplicableDiscount, TenantTransaction } from './subscriptions.types.js';

export interface DiscountEligibilityInput {
  startsAt: Date;
  endsAt: Date | null;
  usageLimit: number | null;
  usageCount: number;
  minimumPurchase: Prisma.Decimal | null;
  minimumQuantity: number | null;
  periodStart: Date;
  purchaseAmount: Prisma.Decimal;
  quantity: number;
}

export function isDiscountEligible(input: DiscountEligibilityInput): boolean {
  return Number.isFinite(input.periodStart.getTime())
    && input.periodStart >= input.startsAt
    && (!input.endsAt || input.periodStart <= input.endsAt)
    && (input.usageLimit === null || input.usageCount < input.usageLimit)
    && (!input.minimumPurchase || input.purchaseAmount.gte(input.minimumPurchase))
    && (input.minimumQuantity === null || input.quantity >= input.minimumQuantity);
}

export async function getApplicableDiscounts(
  tx: TenantTransaction,
  subscriptionId: string,
  periodStart: Date,
): Promise<ApplicableDiscount[]> {
  if (!Number.isFinite(periodStart.getTime())) throw new RangeError('periodStart must be a valid date');
  const subscription = await tx.prisma.subscription.findFirst({
    where: { id: subscriptionId, tenantId: tx.tenantId },
    include: {
      lines: true,
      plan: { select: { price: true } },
    },
  });
  if (!subscription) throw new Error('Subscription not found in tenant');
  if (subscription.status !== 'ACTIVE') throw new Error('Discounts can only be evaluated for active subscriptions');

  const subscriptionQuantity = subscription.quantity;
  const rules = await tx.prisma.discountRule.findMany({
    where: {
      tenantId: tx.tenantId,
      startsAt: { lte: periodStart },
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: periodStart } }] }],
      appliesTo: { in: ['PRODUCTS', 'SUBSCRIPTIONS'] },
    },
    include: { targets: true },
  });

  const applicable: ApplicableDiscount[] = [];
  for (const rule of rules) {
    const targetIds = rule.targets.map((target) => target.productId);
    const productLines = rule.appliesTo === 'PRODUCTS'
      ? subscription.lines.filter((line) => targetIds.includes(line.productId))
      : subscription.lines;
    if (rule.appliesTo === 'PRODUCTS' && productLines.length === 0) continue;

    const productAmount = productLines.reduce(
      (total, line) => total.plus(line.amount),
      new Prisma.Decimal(0),
    );
    const purchaseAmount = rule.appliesTo === 'SUBSCRIPTIONS'
      ? productAmount.plus(subscription.plan.price.mul(subscriptionQuantity))
      : productAmount;
    const quantity = rule.appliesTo === 'SUBSCRIPTIONS'
      ? subscriptionQuantity
      : productLines.reduce((total, line) => total + line.quantity, 0);
    if (!isDiscountEligible({
      startsAt: rule.startsAt,
      endsAt: rule.endsAt,
      usageLimit: rule.usageLimit,
      usageCount: rule.usageCount,
      minimumPurchase: rule.minimumPurchase,
      minimumQuantity: rule.minimumQuantity,
      periodStart,
      purchaseAmount,
      quantity,
    })) continue;

    applicable.push({
        discountId: rule.id,
        kind: rule.kind,
        value: rule.value,
        appliesTo: rule.appliesTo,
        productIds: targetIds,
      });
  }
  return applicable;
}

export async function recordDiscountUsage(
  tx: TenantTransaction,
  discountId: string,
  invoiceId: string,
): Promise<{ recorded: boolean; usageCount: number }> {
  if (!invoiceId.trim()) throw new TypeError('invoiceId is required');
  const rule = await tx.prisma.discountRule.findFirst({
    where: { id: discountId, tenantId: tx.tenantId },
    select: { id: true, usageCount: true, usageLimit: true },
  });
  if (!rule) throw new Error('Discount not found in tenant');
  const invoice = await tx.prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId: tx.tenantId },
    select: { id: true },
  });
  if (!invoice) throw new Error('Invoice not found in tenant');

  const inserted = await tx.prisma.discountUsage.createMany({
    data: [{ tenantId: tx.tenantId, discountId, invoiceId }],
    skipDuplicates: true,
  });
  if (inserted.count === 0) {
    const current = await tx.prisma.discountRule.findFirstOrThrow({
      where: { id: discountId, tenantId: tx.tenantId },
      select: { usageCount: true },
    });
    return { recorded: false, usageCount: current.usageCount };
  }

  const updated = await tx.prisma.discountRule.updateMany({
    where: {
      id: discountId,
      tenantId: tx.tenantId,
      ...(rule.usageLimit === null ? {} : { usageCount: { lt: rule.usageLimit } }),
    },
    data: { usageCount: { increment: 1 } },
  });
  if (updated.count !== 1) {
    throw new Error('Discount usage limit reached; transaction must be rolled back');
  }
  const current = await tx.prisma.discountRule.findFirstOrThrow({
    where: { id: discountId, tenantId: tx.tenantId },
    select: { usageCount: true },
  });
  return { recorded: true, usageCount: current.usageCount };
}
