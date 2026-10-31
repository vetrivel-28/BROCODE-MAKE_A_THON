import type { Request, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "./errors.js";

export function controller(
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
      .catch((error: unknown) => {
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
        if (error instanceof AppError) {
          response.status(error.statusCode).json({
            error: { code: error.code, message: error.message },
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
        console.error("Request failed:", { name: errorName, code: errorCode });
        response.status(500).json({
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      });
  };
}

export function getPrincipal(request: Request) {
  if (!request.identity) {
    throw new AppError("A valid access token is required", 401, "UNAUTHENTICATED");
  }
  return request.identity;
}

export function requireTenant(request: Request) {
  const principal = getPrincipal(request);
  if (!principal.tenantId) {
    throw new AppError("This action requires a tenant context", 403, "NO_TENANT");
  }
  return principal as typeof principal & { tenantId: string };
}

export function getParamId(request: Request): string {
  const value = request.params.id;
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return "";
}

