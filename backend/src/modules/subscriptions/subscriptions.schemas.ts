import { z } from 'zod';

const id = z.string().min(1).max(128);
const date = z.string().datetime({ offset: true });

export const createFromTemplateInput = z.object({
  idempotencyKey: z.string().trim().min(8).max(128),
  templateId: id,
  customerId: id,
  startDate: date,
  expiryDate: date.nullable().optional(),
  paymentTerms: z.string().trim().min(1).max(500),
  quantity: z.number().int().min(1).max(100000),
}).refine(
  (value) => !value.expiryDate || new Date(value.expiryDate) >= new Date(value.startDate),
  { message: 'Expiry date must be on or after start date', path: ['expiryDate'] },
);

export const transitionInput = z.object({
  action: z.enum(['submitQuotation', 'confirm', 'activate', 'pause', 'resume', 'renew', 'close']),
  idempotencyKey: z.string().trim().min(8).max(128),
  startDate: date.optional(),
  expiryDate: date.optional(),
  quotationExpiresAt: date.optional(),
}).refine(
  (value) => value.action !== 'submitQuotation' || Boolean(value.quotationExpiresAt),
  { message: 'Quotation expiry is required when submitting a quotation', path: ['quotationExpiresAt'] },
);

export const subscriptionListQuery = z.object({
  take: z.coerce.number().int().min(1).max(100).default(25),
  cursor: id.optional(),
  status: z.enum(['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CLOSED']).optional(),
  customerId: id.optional(),
  search: z.string().trim().min(1).max(160).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
}).refine(
  (value) => !value.fromDate || !value.toDate || value.fromDate <= value.toDate,
  { message: 'Date range end must be on or after its start', path: ['toDate'] },
);

export const dueSubscriptionQuery = z.object({
  take: z.coerce.number().int().min(1).max(100).default(50),
  cursor: id.optional(),
  asOf: date.optional(),
});

export const recordDiscountUsageInput = z.object({
  discountId: id,
  invoiceId: id,
});

export const subscriptionParams = z.object({ subscriptionId: id });
export const applicableDiscountsQuery = z.object({ periodStart: date });
export const timelineQuery = z.object({
  take: z.coerce.number().int().min(1).max(100).default(25),
  cursor: id.optional(),
});
