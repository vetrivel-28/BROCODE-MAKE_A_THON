import { z } from 'zod';

const money = z.string().regex(/^\d{1,10}(\.\d{1,2})?$/, 'Enter a non-negative amount with up to two decimals');
const id = z.string().min(1).max(128);
const date = z.string().datetime({ offset: true });

export const productInput = z.object({
  name: z.string().trim().min(1).max(160),
  type: z.string().trim().min(1).max(80),
  salesPrice: money,
  costPrice: money,
  notes: z.string().trim().max(4000).nullable().optional(),
  variants: z.array(z.object({
    attribute: z.string().trim().min(1).max(80),
    value: z.string().trim().min(1).max(120),
    extraPrice: money,
  })).max(100).default([]),
});

export const planInput = z.object({
  name: z.string().trim().min(1).max(160),
  price: money,
  billingPeriod: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  minimumQuantity: z.number().int().min(1).max(100000),
  availableFrom: date.nullable().optional(),
  availableUntil: date.nullable().optional(),
  autoClose: z.boolean().default(false),
  closable: z.boolean().default(true),
  pausable: z.boolean().default(false),
  renewable: z.boolean().default(false),
}).refine(
  (value) => !value.availableFrom || !value.availableUntil
    || new Date(value.availableFrom) <= new Date(value.availableUntil),
  { message: 'Availability end must be on or after its start', path: ['availableUntil'] },
);

export const templateInput = z.object({
  name: z.string().trim().min(1).max(160),
  validityDays: z.number().int().min(1).max(365),
  planId: id,
  lines: z.array(z.object({
    productId: id,
    quantity: z.number().int().min(1).max(100000),
    unitPrice: money,
    taxRate: z.string().regex(/^\d{1,3}(\.\d{1,4})?$/),
  })).min(1).max(500),
}).refine(
  (value) => value.lines.every((line) => Number(line.taxRate) <= 100),
  { message: 'Tax rates cannot exceed 100%', path: ['lines'] },
);

export const discountInput = z.object({
  name: z.string().trim().min(1).max(160),
  kind: z.enum(['FIXED', 'PERCENT']),
  value: z.string().regex(/^\d{1,10}(\.\d{1,2})?$/),
  minimumPurchase: money.nullable().optional(),
  minimumQuantity: z.number().int().min(1).nullable().optional(),
  startsAt: date,
  endsAt: date.nullable().optional(),
  usageLimit: z.number().int().min(1).nullable().optional(),
  appliesTo: z.enum(['PRODUCTS', 'SUBSCRIPTIONS']),
  productIds: z.array(id).max(500).default([]),
}).refine(
  (value) => !value.endsAt || new Date(value.startsAt) <= new Date(value.endsAt),
  { message: 'End date must be on or after start date', path: ['endsAt'] },
).refine(
  (value) => new Set(value.productIds).size === value.productIds.length,
  { message: 'Product targets must be unique', path: ['productIds'] },
).refine(
  (value) => value.appliesTo !== 'PRODUCTS' || value.productIds.length > 0,
  { message: 'Product discounts must target at least one product', path: ['productIds'] },
).refine(
  (value) => value.kind !== 'PERCENT' || Number(value.value) <= 100,
  { message: 'Percent discounts cannot exceed 100', path: ['value'] },
);

export const listQuery = z.object({
  take: z.coerce.number().int().min(1).max(100).default(25),
  cursor: id.optional(),
  search: z.string().trim().min(1).max(160).optional(),
  type: z.string().trim().min(1).max(80).optional(),
});

export const discountParams = z.object({ discountId: id });

export const seatSuggestionQuery = z.object({
  currentSeats: z.coerce.number().int().min(0).max(100000),
  suggestedSeats: z.coerce.number().int().min(1).max(100000),
  take: z.coerce.number().int().min(1).max(100).default(25),
  cursor: id.optional(),
}).refine(
  (value) => value.suggestedSeats >= value.currentSeats,
  { message: 'Suggested seats must be at least the current seat count', path: ['suggestedSeats'] },
);
