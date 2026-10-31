import { z } from 'zod';

export const invoiceStatusSchema = z.enum(['DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED']);

export const generateInvoiceSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  periodStart: z.coerce.date(),
});

export const manualCreateInvoiceSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  lines: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().int().nonnegative(),
        discountAmount: z.number().int().nonnegative().optional().default(0),
        taxId: z.string().optional(),
        isTaxInclusive: z.boolean().optional().default(false),
        productId: z.string().optional(),
        variantId: z.string().optional(),
      })
    )
    .min(1, 'At least one line item is required'),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

export const patchInvoiceSchema = z.object({
  notes: z.string().optional(),
  terms: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  lines: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().int().nonnegative(),
        discountAmount: z.number().int().nonnegative().optional().default(0),
        taxId: z.string().optional(),
        isTaxInclusive: z.boolean().optional().default(false),
        productId: z.string().optional(),
        variantId: z.string().optional(),
      })
    )
    .optional(),
});

export const queryInvoicesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: invoiceStatusSchema.optional(),
  overdue: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  customerId: z.string().optional(),
  subscriptionId: z.string().optional(),
  search: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const sendInvoiceSchema = z.object({
  recipientEmail: z.string().email().optional(),
  customMessage: z.string().optional(),
});

export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
export type ManualCreateInvoiceInput = z.infer<typeof manualCreateInvoiceSchema>;
export type PatchInvoiceInput = z.infer<typeof patchInvoiceSchema>;
export type QueryInvoicesInput = z.infer<typeof queryInvoicesSchema>;
export type SendInvoiceInput = z.infer<typeof sendInvoiceSchema>;
