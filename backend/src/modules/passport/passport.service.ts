import { prisma } from "../../config/prisma.js";
import { AppError } from "../../shared/errors.js";

const PLAN_LOCKED_FEATURES: Record<string, string[]> = {
  FREE: ["staff_management", "customizations", "advanced_invoicing", "api_access"],
  STANDARD: ["api_access", "composable_workspace"],
  CUSTOM: [],
};

const ALL_FEATURES = [
  "staff_management",
  "customizations",
  "advanced_invoicing",
  "api_access",
  "composable_workspace",
  "basic_invoicing",
  "wallet",
  "quotations",
];

export const passportService = {
  async getPassport(tenantId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { tenantId, status: "ACTIVE" },
      include: { platformPlan: true },
    });

    if (!subscription) {
      throw new AppError("No active subscription found", 400, "NO_ACTIVE_SUBSCRIPTION");
    }

    const { platformPlan } = subscription;

    // Count used customizations for this subscription period
    const usedSlots = await prisma.customization.count({
      where: {
        tenantId,
        status: { in: ["PENDING", "IN_PROGRESS", "COMPLETED"] },
        createdAt: { gte: subscription.startsAt },
      },
    });

    const wallet = await prisma.wallet.findUnique({ where: { tenantId } });

    const planCode = platformPlan.code.toUpperCase();
    const lockedFeatures = PLAN_LOCKED_FEATURES[planCode] ?? PLAN_LOCKED_FEATURES["CUSTOM"] ?? [];
    const availableFeatures = ALL_FEATURES.filter((f) => !lockedFeatures.includes(f));

    const included = subscription.customizationSlotsIncluded;
    const remaining = Math.max(0, included - usedSlots);

    const planSnapshot = subscription.planSnapshot as Record<string, unknown>;

    return {
      plan: {
        code: platformPlan.code,
        name: platformPlan.name,
        price: platformPlan.price,
        billingInterval: platformPlan.billingInterval,
        appLimit: platformPlan.appLimit,
        customizationSlots: platformPlan.customizationSlots,
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
        startsAt: subscription.startsAt,
        endsAt: subscription.endsAt,
        quantity: subscription.quantity,
        priceSnapshot: subscription.priceSnapshot,
        currency: subscription.currency,
      },
      entitlements: planSnapshot?.entitlements ?? {},
      customizationSlots: {
        included,
        used: usedSlots,
        remaining,
      },
      wallet: wallet
        ? { balance: wallet.balance, currency: wallet.currency }
        : { balance: 0, currency: "INR" },
      lockedFeatures,
      availableFeatures,
    };
  },
};
