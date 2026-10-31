import { Prisma, type PrismaClient } from '../../generated/prisma/client.js';
import type { Page } from './catalog.types.js';
import type { z } from 'zod';
import { discountInput, planInput, productInput, templateInput } from './catalog.schemas.js';

type ProductInput = z.infer<typeof productInput>;
type PlanInput = z.infer<typeof planInput>;
type TemplateInput = z.infer<typeof templateInput>;
type DiscountInput = z.infer<typeof discountInput>;

function cursorPage<T extends { id: string }>(
  rows: T[],
  take: number,
): Page<T> {
  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null };
}

export async function listProducts(prisma: PrismaClient, tenantId: string, take: number, cursor?: string) {
  const rows = await prisma.product.findMany({
    where: { tenantId },
    orderBy: { id: 'asc' },
    take: take + 1,
    ...(cursor ? { cursor: { tenantId_id: { tenantId, id: cursor } }, skip: 1 } : {}),
    include: { variants: true },
  });
  return cursorPage(rows, take);
}

export async function createProduct(prisma: PrismaClient, tenantId: string, input: ProductInput) {
  return prisma.product.create({
    data: {
      tenantId,
      name: input.name,
      type: input.type,
      salesPrice: input.salesPrice,
      costPrice: input.costPrice,
      notes: input.notes,
      variants: { create: input.variants.map((variant) => ({ ...variant, tenantId })) },
    },
    include: { variants: true },
  });
}

export async function listPlans(prisma: PrismaClient, tenantId: string, take: number, cursor?: string) {
  const rows = await prisma.plan.findMany({
    where: { tenantId },
    orderBy: { id: 'asc' },
    take: take + 1,
    ...(cursor ? { cursor: { tenantId_id: { tenantId, id: cursor } }, skip: 1 } : {}),
  });
  return cursorPage(rows, take);
}

export async function createPlan(prisma: PrismaClient, tenantId: string, input: PlanInput) {
  return prisma.plan.create({
    data: {
      tenantId,
      ...input,
      availableFrom: input.availableFrom ? new Date(input.availableFrom) : null,
      availableUntil: input.availableUntil ? new Date(input.availableUntil) : null,
    },
  });
}

export async function listTemplates(prisma: PrismaClient, tenantId: string, take: number, cursor?: string) {
  const rows = await prisma.quotationTemplate.findMany({
    where: { tenantId },
    orderBy: { id: 'asc' },
    take: take + 1,
    ...(cursor ? { cursor: { tenantId_id: { tenantId, id: cursor } }, skip: 1 } : {}),
    include: { plan: true, lines: { include: { product: true } } },
  });
  return cursorPage(rows, take);
}

export async function createTemplate(prisma: PrismaClient, tenantId: string, input: TemplateInput) {
  const [plan, ...products] = await Promise.all([
    prisma.plan.findFirst({ where: { id: input.planId, tenantId } }),
    ...input.lines.map((line) => prisma.product.findFirst({ where: { id: line.productId, tenantId } })),
  ]);
  if (!plan) throw new Error('Plan not found in tenant');
  if (products.some((product) => !product)) throw new Error('Product not found in tenant');

  return prisma.quotationTemplate.create({
    data: {
      tenantId,
      name: input.name,
      validityDays: input.validityDays,
      planId: input.planId,
      lines: {
        create: input.lines.map((line) => {
          const amount = new Prisma.Decimal(line.unitPrice).mul(line.quantity).toDecimalPlaces(2);
          return {
            tenantId,
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            taxRate: line.taxRate,
            amount,
          };
        }),
      },
    },
    include: { plan: true, lines: { include: { product: true } } },
  });
}

export async function listDiscounts(prisma: PrismaClient, tenantId: string, take: number, cursor?: string) {
  const rows = await prisma.discountRule.findMany({
    where: { tenantId },
    orderBy: { id: 'asc' },
    take: take + 1,
    ...(cursor ? { cursor: { tenantId_id: { tenantId, id: cursor } }, skip: 1 } : {}),
    include: { targets: true },
  });
  return cursorPage(rows, take);
}

export async function createDiscount(prisma: PrismaClient, tenantId: string, input: DiscountInput) {
  if (input.productIds.length) {
    const count = await prisma.product.count({ where: { tenantId, id: { in: input.productIds } } });
    if (count !== new Set(input.productIds).size) throw new Error('One or more products were not found in tenant');
  }
  return prisma.discountRule.create({
    data: {
      tenantId,
      name: input.name,
      kind: input.kind,
      value: input.value,
      minimumPurchase: input.minimumPurchase ?? null,
      minimumQuantity: input.minimumQuantity ?? null,
      startsAt: new Date(input.startsAt),
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      usageLimit: input.usageLimit ?? null,
      appliesTo: input.appliesTo,
      targets: { create: input.productIds.map((productId) => ({ tenantId, productId })) },
    },
    include: { targets: true },
  });
}

export async function suggestSeatDiscounts(
  prisma: PrismaClient,
  tenantId: string,
  currentSeats: number,
  suggestedSeats: number,
  page: { take: number; cursor?: string },
  now = new Date(),
) {
  const incrementalSeats = Math.max(0, suggestedSeats - currentSeats);
  const discounts = await prisma.discountRule.findMany({
    where: {
      tenantId,
      appliesTo: 'SUBSCRIPTIONS',
      startsAt: { lte: now },
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      OR: [{ minimumQuantity: null }, { minimumQuantity: { lte: suggestedSeats } }],
    },
    orderBy: { id: 'asc' },
    take: page.take + 1,
    ...(page.cursor ? { cursor: { tenantId_id: { tenantId, id: page.cursor } }, skip: 1 } : {}),
  });
  const hasMore = discounts.length > page.take;
  const candidates = hasMore ? discounts.slice(0, page.take) : discounts;
  const eligibleDiscounts = candidates.filter((discount) =>
    discount.usageLimit === null || discount.usageCount < discount.usageLimit);
  return {
    currentSeats,
    suggestedSeats,
    incrementalSeats,
    eligibleDiscounts,
    nextCursor: hasMore ? candidates[candidates.length - 1]?.id ?? null : null,
  };
}
