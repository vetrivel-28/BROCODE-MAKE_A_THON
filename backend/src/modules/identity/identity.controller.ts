import type { Request, RequestHandler } from "express";
import { ZodError } from "zod";
import { identityService } from "./identity.service.js";
import { IdentityError, type AuthPrincipal } from "./identity.types.js";
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  signupSchema,
} from "./identity.validation.js";
import { z } from "zod";
import { passwordResetService } from "./services/passwordReset.service.js";

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

const requestPasswordResetSchema = z.object({
  email: z.string().email().toLowerCase(),
}).strict();

const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: passwordSchema,
}).strict();

function handleError(error: unknown, response: Parameters<RequestHandler>[1]) {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        issues: error.issues.map(({ path, message }) => ({ path, message })),
      },
    });
    return;
  }

  if (error instanceof IdentityError) {
    response.status(error.statusCode).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  // Import AppError dynamically to avoid circular deps
  if (error instanceof Error && error.name === "AppError") {
    const appError = error as unknown as {
      statusCode: number;
      code: string;
      message: string;
    };
    response.status(appError.statusCode).json({
      error: { code: appError.code, message: appError.message },
    });
    return;
  }

  const errorName = error instanceof Error ? error.name : "UnknownError";
  const errorCode =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : undefined;
  console.error("Identity request failed:", { name: errorName, code: errorCode });
  response.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
}

function getPrincipal(request: Request): AuthPrincipal {
  if (!request.identity) {
    throw new IdentityError(
      "A valid access token is required",
      401,
      "UNAUTHENTICATED",
    );
  }
  return request.identity;
}

function controller(
  handler: (request: Request) => Promise<unknown>,
  statusCode = 200,
): RequestHandler {
  return (request, response) => {
    void handler(request)
      .then((result) => {
        if (statusCode === 204) {
          response.status(204).end();
          return;
        }
        response.status(statusCode).json(result);
      })
      .catch((error: unknown) => handleError(error, response));
  };
}

export const identityController = {
  signup: controller(async (request) =>
    identityService.signup(signupSchema.parse(request.body)),
    201,
  ),

  login: controller(async (request) =>
    identityService.login(loginSchema.parse(request.body)),
  ),

  refresh: controller(async (request) =>
    identityService.refresh(refreshSchema.parse(request.body)),
  ),

  logout: controller(async (request) => {
    const principal = getPrincipal(request);
    const body = logoutSchema.parse(request.body);
    await identityService.logout(body.refreshToken, {
      id: principal.userId,
      tenantId: principal.tenantId,
      role: principal.role,
    });
  }, 204),

  me: controller(async (request) => {
    const principal = getPrincipal(request);
    return { user: await identityService.me(principal.userId, principal.tenantId) };
  }),

  requestPasswordReset: controller(async (request) => {
    const { email } = requestPasswordResetSchema.parse(request.body);
    return passwordResetService.requestReset(email);
  }),

  resetPassword: controller(async (request) => {
    const { token, password } = resetPasswordSchema.parse(request.body);
    return passwordResetService.resetPassword(token, password);
  }),
};
