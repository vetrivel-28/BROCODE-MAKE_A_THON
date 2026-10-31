import { z } from "zod";

export const createSubscriptionOrderSchema = z.object({
  subscriptionId: z.string().min(1),
}).strict();

export const verifySubscriptionPaymentSchema = z.object({
  subscriptionId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
}).strict();

export const createInvoiceOrderSchema = z.object({
  invoiceId: z.string().min(1),
}).strict();

export const verifyInvoicePaymentSchema = z.object({
  invoiceId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
}).strict();

