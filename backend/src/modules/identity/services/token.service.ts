import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import { env } from "../../../config/env.js";
import { UserRole } from "../../../generated/prisma/enums.js";

const headerSchema = z
  .object({
    alg: z.literal("HS256"),
    typ: z.literal("JWT"),
  })
  .strict();

const claimsSchema = z
  .object({
    sub: z.string().min(1),
    tenantId: z.string().min(1).nullable(),
    role: z.enum([
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.STAFF,
      UserRole.CUSTOMER,
    ]),
    iat: z.number().int(),
    exp: z.number().int(),
    iss: z.literal("loopdesk"),
    aud: z.literal("loopdesk-api"),
    jti: z.string().uuid(),
  })
  .strict();

export interface TokenUser {
  id: string;
  tenantId: string | null;
  role: UserRole;
}

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(unsignedToken: string): Buffer {
  return createHmac("sha256", env.JWT_ACCESS_SECRET)
    .update(unsignedToken)
    .digest();
}

function parseJsonSegment(segment: string): unknown {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as unknown;
}

export const tokenService = {
  createAccessToken(user: TokenUser): string {
    const now = Math.floor(Date.now() / 1000);
    const header = encodeJson({ alg: "HS256", typ: "JWT" });
    const payload = encodeJson({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      iat: now,
      exp: now + env.ACCESS_TOKEN_TTL_SECONDS,
      iss: "loopdesk",
      aud: "loopdesk-api",
      jti: randomUUID(),
    });
    const unsignedToken = `${header}.${payload}`;
    return `${unsignedToken}.${sign(unsignedToken).toString("base64url")}`;
  },

  verifyAccessToken(token: string) {
    if (token.length > 8192) {
      return null;
    }

    const parts = token.split(".");
    if (
      parts.length !== 3 ||
      parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))
    ) {
      return null;
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      return null;
    }

    try {
      const header = headerSchema.safeParse(parseJsonSegment(encodedHeader));
      const claims = claimsSchema.safeParse(parseJsonSegment(encodedPayload));
      if (!header.success || !claims.success) {
        return null;
      }

      const actualSignature = Buffer.from(encodedSignature, "base64url");
      const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`);
      if (
        actualSignature.length !== expectedSignature.length ||
        !timingSafeEqual(actualSignature, expectedSignature)
      ) {
        return null;
      }

      const now = Math.floor(Date.now() / 1000);
      if (
        claims.data.exp <= now ||
        claims.data.iat > now + 60 ||
        claims.data.exp <= claims.data.iat
      ) {
        return null;
      }

      return {
        userId: claims.data.sub,
        tenantId: claims.data.tenantId,
        role: claims.data.role,
      };
    } catch {
      return null;
    }
  },

  createRefreshToken(): string {
    return randomBytes(32).toString("base64url");
  },

  hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  },

  createTokenFamilyId(): string {
    return randomUUID();
  },

  refreshTokenExpiry(now = new Date()): Date {
    return new Date(
      now.getTime() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
  },
};
