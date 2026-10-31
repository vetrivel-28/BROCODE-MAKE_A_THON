import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  currency: z.string().length(3).optional().default("INR"),
  sku: z.string().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  sku: z.string().optional(),
});

export const listProductsSchema = z.object({
  search: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsInput = z.infer<typeof listProductsSchema>;
