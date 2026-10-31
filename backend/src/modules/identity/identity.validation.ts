import { z } from "zod";

const passwordSchema = z
  .string()
  .min(9, "Password must be more than 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character")
  .refine(
    (password) => Buffer.byteLength(password, "utf8") <= 72,
    "Password must not exceed 72 UTF-8 bytes",
  );

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .transform((email) => email.toLowerCase());

export const signupSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    tenantName: z.string().trim().min(1).max(160),
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z
      .string()
      .min(1)
      .refine(
        (password) => Buffer.byteLength(password, "utf8") <= 72,
        "Password must not exceed 72 UTF-8 bytes",
      ),
  })
  .strict();

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(32).max(512),
  })
  .strict();

export const logoutSchema = refreshSchema;

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
