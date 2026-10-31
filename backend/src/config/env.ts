import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must contain at least 32 characters"),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().max(3600).default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().max(365).default(30),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional().default("noreply@loopdesk.app"),
  APP_URL: z.string().url().optional().default("http://localhost:5173"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const invalidVariables = [
    ...new Set(parsedEnv.error.issues.map((issue) => issue.path.join("."))),
  ];
  throw new Error(
    `Invalid backend environment configuration: ${invalidVariables.join(", ")}`,
  );
}

export const env = parsedEnv.data;
