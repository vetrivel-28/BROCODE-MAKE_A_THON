import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  taxRate: z.number().min(0).max(100).optional().default(0),
});

export const createQuotationSchema = z.object({
  subscriptionId: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1),
  notes: z.string().optional(),
  validUntil: z.coerce.date().optional(),
  discountAmount: z.number().min(0).optional().default(0),
});

export const updateQuotationSchema = z.object({
  subscriptionId: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1).optional(),
  notes: z.string().optional(),
  validUntil: z.coerce.date().optional(),
  discountAmount: z.number().min(0).optional(),
});

export const confirmQuotationSchema = z.object({});

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
