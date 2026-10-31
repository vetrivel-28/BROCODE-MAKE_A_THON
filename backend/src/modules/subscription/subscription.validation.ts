import { z } from "zod";

export const createSubscriptionSchema = z.object({
  planCode: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  billingInterval: z.enum(["MONTHLY", "YEARLY", "ONE_TIME"]).optional(),
}).strict();

export const updateSubscriptionSchema = z.object({
  quantity: z.number().int().positive().optional(),
}).strict();

export const changeSubscriptionPlanSchema = z.object({
  planCode: z.string().min(1),
  quantity: z.number().int().positive().optional(),
}).strict();

export const activateSubscriptionSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
}).strict();

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type ChangeSubscriptionPlanInput = z.infer<typeof changeSubscriptionPlanSchema>;
export type ActivateSubscriptionInput = z.infer<typeof activateSubscriptionSchema>;

