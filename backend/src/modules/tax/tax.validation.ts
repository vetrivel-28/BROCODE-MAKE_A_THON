import { z } from "zod";

export const createTaxSchema = z.object({
  name: z.string().min(1).max(100),
  rate: z.number().min(0).max(100),
  description: z.string().optional(),
});

export const updateTaxSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  rate: z.number().min(0).max(100).optional(),
  description: z.string().optional(),
});

export type CreateTaxInput = z.infer<typeof createTaxSchema>;
export type UpdateTaxInput = z.infer<typeof updateTaxSchema>;
