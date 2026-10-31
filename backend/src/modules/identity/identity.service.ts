import { randomUUID } from "node:crypto";
import { prisma } from "../../config/prisma.js";
import { UserRole } from "../../generated/prisma/enums.js";
import { Prisma, type PrismaClient } from "../../generated/prisma/client.js";
import type {
  LoginInput,
  RefreshInput,
  SignupInput,
} from "./identity.validation.js";
import { IdentityError } from "./identity.types.js";
import { passwordService } from "./services/password.service.js";
import {
  tokenService,
  type TokenUser,
} from "./services/token.service.js";

type DatabaseClient = Pick<PrismaClient, "refreshToken">;

function createTenantSlug(tenantName: string): string {
  const nameSlug = tenantName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

  return `${nameSlug || "tenant"}-${randomUUID()}`;
}

function isUniqueEmailConstraintError(error: unknown): boolean {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    error.code !== "P2002" ||
    !("meta" in error) ||
    typeof error.meta !== "object" ||
    error.meta === null ||
    !("target" in error.meta)
  ) {
    return false;
  }

  return JSON.stringify(error.meta)?.toLowerCase().includes("email") ?? false;
}

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: TokenUser["role"];
  tenantId: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  };
}

async function createRefreshTokenRecord(
  database: DatabaseClient,
  user: TokenUser,
  familyId: string,
) {
  const refreshToken = tokenService.createRefreshToken();
  const tokenHash = tokenService.hashRefreshToken(refreshToken);

  await database.refreshToken.create({
    data: {
      tokenHash,
      familyId,
      userId: user.id,
      expiresAt: tokenService.refreshTokenExpiry(),
    },
  });

  return refreshToken;
}

async function createTokenPair(
  database: DatabaseClient,
  user: TokenUser,
  familyId = tokenService.createTokenFamilyId(),
) {
  const refreshToken = await createRefreshTokenRecord(database, user, familyId);

  return {
    accessToken: tokenService.createAccessToken(user),
    refreshToken,
  };
}

export const identityService = {
  async signup(input: SignupInput) {
    const passwordHash = await passwordService.hash(input.password);

    try {
      return await prisma.$transaction(async (transaction) => {
        const tenant = await transaction.tenant.create({
          data: {
            name: input.tenantName,
            slug: createTenantSlug(input.tenantName),
          },
        });
        const user = await transaction.user.create({
          data: {
            name: input.name,
            email: input.email,
            passwordHash,
            role: UserRole.ADMIN,
            tenantId: tenant.id,
          },
        });
        const freePlan = await transaction.platformPlan.findUnique({
          where: { code: "FREE" },
        });
        if (!freePlan || !freePlan.isActive || !freePlan.price.isZero()) {
          throw new Error(
            "The active zero-price FREE PlatformPlan must be seeded before signup",
          );
        }

        await transaction.wallet.create({
          data: {
            tenantId: tenant.id,
            currency: freePlan.currency,
          },
        });
        const entitlementsSnapshot =
          freePlan.entitlements === null
            ? null
            : (freePlan.entitlements as Prisma.InputJsonValue);
        await transaction.subscription.create({
          data: {
            tenantId: tenant.id,
            platformPlanId: freePlan.id,
            status: "ACTIVE",
            quantity: 1,
            unitPriceSnapshot: freePlan.price,
            priceSnapshot: freePlan.price,
            currency: freePlan.currency,
            billingInterval: freePlan.billingInterval,
            customizationSlotsIncluded: freePlan.customizationSlots,
            planSnapshot: {
              code: freePlan.code,
              name: freePlan.name,
              description: freePlan.description,
              price: freePlan.price.toString(),
              currency: freePlan.currency,
              billingInterval: freePlan.billingInterval,
              appLimit: freePlan.appLimit,
              customizationSlots: freePlan.customizationSlots,
              entitlements: entitlementsSnapshot,
            },
          },
        });
        const tokens = await createTokenPair(transaction, user);

        return { user: publicUser(user), ...tokens };
      });
    } catch (error) {
      if (isUniqueEmailConstraintError(error)) {
        throw new IdentityError(
          "An account with this email already exists",
          409,
          "EMAIL_ALREADY_EXISTS",
        );
      }
      throw error;
    }
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: input.email, mode: "insensitive" } },
    });
    const passwordMatches = await passwordService.verify(
      input.password,
      user?.passwordHash,
    );

    if (!user || !passwordMatches) {
      throw new IdentityError(
        "Email or password is incorrect",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    const tokens = await prisma.$transaction((transaction) =>
      createTokenPair(transaction, user),
    );

    return { user: publicUser(user), ...tokens };
  },

  async refresh(input: RefreshInput) {
    const presentedHash = tokenService.hashRefreshToken(input.refreshToken);
    const replacementToken = tokenService.createRefreshToken();
    const replacementHash = tokenService.hashRefreshToken(replacementToken);
    const now = new Date();

    const result = await prisma.$transaction(async (transaction) => {
      const record = await transaction.refreshToken.findUnique({
        where: { tokenHash: presentedHash },
        include: { user: true },
      });

      if (!record) {
        return { kind: "invalid" as const };
      }

      if (record.revokedAt) {
        await transaction.refreshToken.updateMany({
          where: { familyId: record.familyId, revokedAt: null },
          data: { revokedAt: now },
        });
        return { kind: "reused" as const };
      }

      if (record.expiresAt <= now) {
        await transaction.refreshToken.updateMany({
          where: { id: record.id, revokedAt: null },
          data: { revokedAt: now },
        });
        return { kind: "invalid" as const };
      }

      const replacementRecord = await transaction.refreshToken.create({
        data: {
          tokenHash: replacementHash,
          familyId: record.familyId,
          userId: record.userId,
          expiresAt: tokenService.refreshTokenExpiry(now),
        },
        select: { id: true },
      });

      const claimed = await transaction.refreshToken.updateMany({
        where: {
          id: record.id,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { revokedAt: now, replacedById: replacementRecord.id },
      });

      if (claimed.count !== 1) {
        await transaction.refreshToken.delete({
          where: { id: replacementRecord.id },
        });
        const currentRecord = await transaction.refreshToken.findUnique({
          where: { id: record.id },
          select: { revokedAt: true },
        });
        if (currentRecord?.revokedAt) {
          await transaction.refreshToken.updateMany({
            where: { familyId: record.familyId, revokedAt: null },
            data: { revokedAt: now },
          });
          return { kind: "reused" as const };
        }
        return { kind: "invalid" as const };
      }

      const tokenUser: TokenUser = {
        id: record.user.id,
        tenantId: record.user.tenantId,
        role: record.user.role,
      };

      return {
        kind: "rotated" as const,
        user: publicUser(record.user),
        accessToken: tokenService.createAccessToken(tokenUser),
      };
    });

    if (result.kind === "reused") {
      throw new IdentityError(
        "Refresh token reuse detected; this token family has been revoked",
        401,
        "REFRESH_TOKEN_REUSE",
      );
    }
    if (result.kind !== "rotated") {
      throw new IdentityError(
        "Refresh token is invalid or expired",
        401,
        "INVALID_REFRESH_TOKEN",
      );
    }

    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: replacementToken,
    };
  },

  async logout(refreshToken: string, user: TokenUser) {
    const tokenHash = tokenService.hashRefreshToken(refreshToken);
    const record = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        userId: user.id,
        user: { tenantId: user.tenantId },
      },
      select: { familyId: true },
    });

    if (!record) {
      return;
    }

    await prisma.refreshToken.updateMany({
      where: { familyId: record.familyId, userId: user.id },
      data: { revokedAt: new Date() },
    });
  },

  async me(userId: string, tenantId: string | null) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
      },
    });

    if (!user) {
      throw new IdentityError(
        "The authenticated account no longer exists",
        401,
        "UNAUTHENTICATED",
      );
    }

    return publicUser(user);
  },
};
