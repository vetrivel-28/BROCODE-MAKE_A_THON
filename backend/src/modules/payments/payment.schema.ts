import { z } from 'zod';

export const paymentMethodSchema = z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE']);

export const recordPaymentSchema = z.object({
  method: paymentMethodSchema,
  amount: z.number().int().positive('Payment amount must be greater than 0 paise'),
  paidOn: z.coerce.date().default(() => new Date()),
  note: z.string().max(500).optional(),
  reference: z.string().max(100).optional(),
  gatewayPaymentId: z.string().max(100).optional(),
});

export const queryPaymentsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  method: paymentMethodSchema.optional(),
  invoiceId: z.string().optional(),
  customerId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type QueryPaymentsInput = z.infer<typeof queryPaymentsSchema>;

