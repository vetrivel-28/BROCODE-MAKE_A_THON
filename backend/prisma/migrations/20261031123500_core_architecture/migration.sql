-- Expand the original identity schema into the approved eight-model architecture.
-- Existing tenant/user/token rows are retained.

-- Reject existing address collisions before normalizing stored addresses.
DO $$
BEGIN
    IF EXISTS (
        SELECT LOWER("email")
        FROM "User"
        GROUP BY LOWER("email")
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Cannot enforce case-insensitive email uniqueness: duplicate addresses differ only by case';
    END IF;
END
$$;

UPDATE "User" SET "email" = LOWER("email");
DROP INDEX "User_email_key";
CREATE UNIQUE INDEX "User_email_lower_key" ON "User" (LOWER("email"));

ALTER TABLE "Tenant" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "Tenant" SET "updatedAt" = CURRENT_TIMESTAMP;
ALTER TABLE "Tenant" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "Tenant" ADD COLUMN "slug" TEXT;
UPDATE "Tenant"
SET "slug" =
    COALESCE(
        NULLIF(
            TRIM(BOTH '-' FROM LEFT(
                REGEXP_REPLACE(LOWER("name"), '[^a-z0-9]+', '-', 'g'),
                80
            )),
            ''
        ),
        'tenant'
    ) || '-' || LOWER("id");
ALTER TABLE "Tenant" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "User" SET "updatedAt" = CURRENT_TIMESTAMP;
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET NOT NULL;

-- Require an explicit tenantless SUPER_ADMIN role; ordinary users remain tenant-scoped.
ALTER TABLE "User" ALTER COLUMN "tenantId" DROP NOT NULL;
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'STAFF', 'CUSTOMER');
ALTER TABLE "User"
    ALTER COLUMN "role" DROP DEFAULT,
    ALTER COLUMN "role" TYPE "UserRole_new"
    USING (
        CASE "role"::TEXT
            WHEN 'ADMIN' THEN 'ADMIN'
            WHEN 'MEMBER' THEN 'STAFF'
            ELSE "role"::TEXT
        END
    )::"UserRole_new";
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
ALTER TABLE "User"
    ADD CONSTRAINT "User_role_tenant_check"
    CHECK (
        ("role" = 'SUPER_ADMIN' AND "tenantId" IS NULL)
        OR ("role" <> 'SUPER_ADMIN' AND "tenantId" IS NOT NULL)
    );

-- Preserve tenant-owned users and business data when a tenant is deleted.
ALTER TABLE "User" DROP CONSTRAINT "User_tenantId_fkey";
ALTER TABLE "User"
    ADD CONSTRAINT "User_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY', 'ONE_TIME');
CREATE TYPE "SubscriptionStatus" AS ENUM ('DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED');
CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- Convert existing hash-based refresh replacement references to token-row references.
ALTER TABLE "RefreshToken" ADD COLUMN "replacedById" TEXT;
UPDATE "RefreshToken" AS current_token
SET "replacedById" = replacement_token."id"
FROM "RefreshToken" AS replacement_token
WHERE current_token."replacedByHash" = replacement_token."tokenHash";
ALTER TABLE "RefreshToken" DROP COLUMN "replacedByHash";
ALTER TABLE "RefreshToken"
    ADD CONSTRAINT "RefreshToken_replacedById_key" UNIQUE ("replacedById"),
    ADD CONSTRAINT "RefreshToken_id_userId_familyId_key" UNIQUE ("id", "userId", "familyId"),
    ADD CONSTRAINT "RefreshToken_replacedById_userId_familyId_key"
        UNIQUE ("replacedById", "userId", "familyId"),
    ADD CONSTRAINT "RefreshToken_replacedById_userId_familyId_fkey"
        FOREIGN KEY ("replacedById", "userId", "familyId")
        REFERENCES "RefreshToken"("id", "userId", "familyId")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "RefreshToken_replacement_not_self_check"
        CHECK ("replacedById" IS NULL OR "replacedById" <> "id");
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PasswordResetToken_expiry_check" CHECK ("expiresAt" > "createdAt")
);
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_usedAt_idx" ON "PasswordResetToken"("userId", "usedAt");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");
ALTER TABLE "PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PlatformPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(19,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "billingInterval" "BillingInterval" NOT NULL,
    "appLimit" INTEGER NOT NULL,
    "customizationSlots" INTEGER NOT NULL,
    "entitlements" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlatformPlan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PlatformPlan_price_nonnegative_check" CHECK ("price" >= 0),
    CONSTRAINT "PlatformPlan_appLimit_positive_check" CHECK ("appLimit" > 0),
    CONSTRAINT "PlatformPlan_customizationSlots_nonnegative_check" CHECK ("customizationSlots" >= 0),
    CONSTRAINT "PlatformPlan_currency_format_check" CHECK ("currency" ~ '^[A-Z]{3}$')
);
CREATE UNIQUE INDEX "PlatformPlan_code_key" ON "PlatformPlan"("code");
CREATE INDEX "PlatformPlan_isActive_code_idx" ON "PlatformPlan"("isActive", "code");

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "platformPlanId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceSnapshot" DECIMAL(19,4) NOT NULL,
    "priceSnapshot" DECIMAL(19,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "billingInterval" "BillingInterval" NOT NULL,
    "customizationSlotsIncluded" INTEGER NOT NULL,
    "planSnapshot" JSONB NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Subscription_quantity_positive_check" CHECK ("quantity" > 0),
    CONSTRAINT "Subscription_unitPrice_nonnegative_check" CHECK ("unitPriceSnapshot" >= 0),
    CONSTRAINT "Subscription_price_nonnegative_check" CHECK ("priceSnapshot" >= 0),
    CONSTRAINT "Subscription_customizationSlots_nonnegative_check"
        CHECK ("customizationSlotsIncluded" >= 0),
    CONSTRAINT "Subscription_currency_format_check" CHECK ("currency" ~ '^[A-Z]{3}$'),
    CONSTRAINT "Subscription_end_after_start_check"
        CHECK ("endsAt" IS NULL OR "endsAt" > "startsAt")
);
CREATE UNIQUE INDEX "Subscription_razorpayOrderId_key"
    ON "Subscription"("razorpayOrderId");
CREATE UNIQUE INDEX "Subscription_razorpayPaymentId_key"
    ON "Subscription"("razorpayPaymentId");
CREATE INDEX "Subscription_tenantId_status_createdAt_idx"
    ON "Subscription"("tenantId", "status", "createdAt");
CREATE INDEX "Subscription_platformPlanId_idx" ON "Subscription"("platformPlanId");
CREATE INDEX "Subscription_status_endsAt_idx"
    ON "Subscription"("status", "endsAt");
CREATE UNIQUE INDEX "Subscription_one_active_per_tenant_key"
    ON "Subscription"("tenantId")
    WHERE "status" = 'ACTIVE';
ALTER TABLE "Subscription"
    ADD CONSTRAINT "Subscription_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "Subscription_platformPlanId_fkey"
        FOREIGN KEY ("platformPlanId") REFERENCES "PlatformPlan"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "balance" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Wallet_balance_nonnegative_check" CHECK ("balance" >= 0),
    CONSTRAINT "Wallet_currency_format_check" CHECK ("currency" ~ '^[A-Z]{3}$')
);
CREATE UNIQUE INDEX "Wallet_tenantId_key" ON "Wallet"("tenantId");
CREATE UNIQUE INDEX "Wallet_id_tenantId_key" ON "Wallet"("id", "tenantId");
ALTER TABLE "Wallet"
    ADD CONSTRAINT "Wallet_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Existing tenants receive an empty INR wallet; tenant data is never deleted here.
INSERT INTO "Wallet" ("id", "tenantId", "balance", "currency", "updatedAt")
SELECT
    'wallet_backfill_' || tenant."id",
    tenant."id",
    0,
    'INR',
    CURRENT_TIMESTAMP
FROM "Tenant" AS tenant
ON CONFLICT ("tenantId") DO NOTHING;

CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "balanceAfter" DECIMAL(19,4) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WalletTransaction_amount_positive_check" CHECK ("amount" > 0),
    CONSTRAINT "WalletTransaction_balance_nonnegative_check" CHECK ("balanceAfter" >= 0)
);
CREATE UNIQUE INDEX "WalletTransaction_idempotencyKey_key"
    ON "WalletTransaction"("idempotencyKey");
CREATE INDEX "WalletTransaction_walletId_createdAt_idx"
    ON "WalletTransaction"("walletId", "createdAt");
CREATE INDEX "WalletTransaction_tenantId_createdAt_idx"
    ON "WalletTransaction"("tenantId", "createdAt");
ALTER TABLE "WalletTransaction"
    ADD CONSTRAINT "WalletTransaction_walletId_tenantId_fkey"
    FOREIGN KEY ("walletId", "tenantId") REFERENCES "Wallet"("id", "tenantId")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed the approved plans; the application seed is independently idempotent.
INSERT INTO "PlatformPlan" (
    "id", "code", "name", "description", "price", "currency",
    "billingInterval", "appLimit", "customizationSlots", "entitlements",
    "isActive", "updatedAt"
) VALUES
(
    'platform_plan_free', 'FREE', 'Free', 'Free plan',
    0, 'INR', 'ONE_TIME', 1, 0,
    '{"appLimit":1,"customizationSlots":0}'::JSONB, TRUE, CURRENT_TIMESTAMP
),
(
    'platform_plan_standard', 'STANDARD', 'Standard', 'General template',
    580, 'INR', 'MONTHLY', 1, 2,
    '{"appLimit":1,"customizationSlots":2,"template":"general"}'::JSONB,
    TRUE, CURRENT_TIMESTAMP
),
(
    'platform_plan_custom', 'CUSTOM', 'Custom', 'Composable workspace',
    1080, 'INR', 'MONTHLY', 1, 10,
    '{"appLimit":1,"customizationSlots":10,"workspace":"composable"}'::JSONB,
    TRUE, CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "price" = EXCLUDED."price",
    "currency" = EXCLUDED."currency",
    "billingInterval" = EXCLUDED."billingInterval",
    "appLimit" = EXCLUDED."appLimit",
    "customizationSlots" = EXCLUDED."customizationSlots",
    "entitlements" = EXCLUDED."entitlements",
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = CURRENT_TIMESTAMP;

-- Give pre-existing tenants the same active Free baseline as new signups.
INSERT INTO "Subscription" (
    "id", "tenantId", "platformPlanId", "status", "quantity",
    "unitPriceSnapshot", "priceSnapshot", "currency", "billingInterval",
    "customizationSlotsIncluded", "planSnapshot", "startsAt", "endsAt",
    "createdAt", "updatedAt"
)
SELECT
    'subscription_backfill_' || tenant."id",
    tenant."id",
    plan."id",
    'ACTIVE',
    1,
    plan."price",
    plan."price",
    plan."currency",
    plan."billingInterval",
    plan."customizationSlots",
    jsonb_build_object(
        'code', plan."code",
        'name', plan."name",
        'description', plan."description",
        'price', plan."price"::TEXT,
        'currency', plan."currency",
        'billingInterval', plan."billingInterval"::TEXT,
        'appLimit', plan."appLimit",
        'customizationSlots', plan."customizationSlots",
        'entitlements', plan."entitlements"
    ),
    CURRENT_TIMESTAMP,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Tenant" AS tenant
CROSS JOIN "PlatformPlan" AS plan
WHERE plan."code" = 'FREE'
  AND NOT EXISTS (
      SELECT 1
      FROM "Subscription" AS existing
      WHERE existing."tenantId" = tenant."id"
        AND existing."status" = 'ACTIVE'
  )
ON CONFLICT ("id") DO NOTHING;
