import { z } from 'zod';

// Password rule: > 8 chars (min 9), 1 uppercase, 1 lowercase, 1 special character
export const passwordSchema = z
  .string()
  .min(9, { message: 'Password must be more than 8 characters' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[^a-zA-Z0-9]/, { message: 'Password must contain at least one special character' });

export const signupSchema = z.object({
  tenantName: z.string().min(2, 'Tenant name must be at least 2 characters'),
  tenantSlug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens').optional(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: passwordSchema,
  tier: z.enum(['FREE', 'STANDARD', 'CUSTOM']).default('STANDARD'),
  industry: z.enum(['retail', 'saas', 'gym', 'coaching']).optional()
});

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required')
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Valid refresh token is required')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required')
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Reset token is required'),
  newPassword: passwordSchema
});

export const createStaffSchema = z.object({
  fullName: z.string().min(2, 'Staff full name is required'),
  email: z.string().email('Valid staff email is required'),
  password: passwordSchema
});

export const createCustomerUserSchema = z.object({
  fullName: z.string().min(2, 'Customer full name is required'),
  email: z.string().email('Valid customer email is required'),
  password: passwordSchema,
  customerId: z.string().optional()
});

export const tierUpgradeSchema = z.object({
  targetTier: z.enum(['STANDARD', 'CUSTOM']),
  razorpayPaymentId: z.string().min(4, 'Razorpay payment ID is required'),
  razorpayOrderId: z.string().optional(),
  razorpaySignature: z.string().optional()
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type CreateCustomerUserInput = z.infer<typeof createCustomerUserSchema>;
export type TierUpgradeInput = z.infer<typeof tierUpgradeSchema>;
