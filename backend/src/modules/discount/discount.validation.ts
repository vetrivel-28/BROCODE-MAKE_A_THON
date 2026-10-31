import { z } from "zod";

export const createDiscountSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Z0-9]+$/, "Code must be uppercase alphanumeric"),
  name: z.string().min(1).max(200),
  type: z.enum(["FIXED", "PERCENTAGE"]),
  value: z.number().positive(),
  maxUses: z.number().int().positive().optional(),
  validUntil: z.coerce.date().optional(),
});

export const updateDiscountSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  isActive: z.boolean().optional(),
  validUntil: z.coerce.date().optional(),
});

export const validateDiscountSchema = z.object({
  code: z.string().min(1),
  amount: z.number().positive(),
});

export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
export type UpdateDiscountInput = z.infer<typeof updateDiscountSchema>;
export type ValidateDiscountInput = z.infer<typeof validateDiscountSchema>;
