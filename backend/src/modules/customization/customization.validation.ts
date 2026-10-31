import { z } from "zod";

export const createCustomizationSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
});

export type CreateCustomizationInput = z.infer<typeof createCustomizationSchema>;
