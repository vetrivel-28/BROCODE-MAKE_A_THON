import type { RequestHandler } from "express";
import type { UserRole } from "../generated/prisma/enums.js";

export function authorize(...roles: UserRole[]): RequestHandler {
  return (request, response, next) => {
    if (!request.identity) {
      response.status(401).json({
        error: { code: "UNAUTHENTICATED", message: "A valid access token is required" },
      });
      return;
    }
    if (roles.length > 0 && !roles.includes(request.identity.role)) {
      response.status(403).json({
        error: { code: "FORBIDDEN", message: "You do not have permission to perform this action" },
      });
      return;
    }
    next();
  };
}

