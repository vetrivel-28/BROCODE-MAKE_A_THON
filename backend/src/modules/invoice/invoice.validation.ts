import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  taxRate: z.number().min(0).max(100).optional().default(0),
});

export const createInvoiceSchema = z.object({
  subscriptionId: z.string().optional(),
  quotationId: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1),
  notes: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  discountAmount: z.number().min(0).optional().default(0),
});

export const updateInvoiceSchema = z.object({
  subscriptionId: z.string().optional(),
  quotationId: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1).optional(),
  notes: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  discountAmount: z.number().min(0).optional(),
});

export const listInvoicesSchema = z.object({
  status: z.enum(["DRAFT", "CONFIRMED", "PAID", "VOID"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type ListInvoicesInput = z.infer<typeof listInvoicesSchema>;
