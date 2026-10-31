import type { Request } from "express";
import type { UserRole } from "../../generated/prisma/enums.js";

export interface AuthPrincipal {
  userId: string;
  tenantId: string | null;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      identity?: AuthPrincipal;
    }
  }
}

export class IdentityError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "IdentityError";
  }
}

export type AuthenticatedRequest = Request & { identity: AuthPrincipal };
