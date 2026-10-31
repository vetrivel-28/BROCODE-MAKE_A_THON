import { z } from 'zod';

export const createTaxSchema = z.object({
  name: z.string().min(1, 'Tax name is required').max(100),
  rate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%'),
  isInclusive: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updateTaxSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  rate: z.number().min(0).max(100).optional(),
  isInclusive: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const queryTaxSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  search: z.string().optional(),
});

export type CreateTaxInput = z.infer<typeof createTaxSchema>;
export type UpdateTaxInput = z.infer<typeof updateTaxSchema>;
export type QueryTaxInput = z.infer<typeof queryTaxSchema>;

