import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../shared/errors.js";
import { Decimal, type DecimalValue } from "../../shared/decimal.js";
import type {
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  ChangeSubscriptionPlanInput,
} from "./subscription.validation.js";
import { SubscriptionStatus } from "../../generated/prisma/enums.js";

const VALID_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  DRAFT: ["QUOTATION", "CONFIRMED"],
  QUOTATION: ["CONFIRMED", "CLOSED"],
  CONFIRMED: ["ACTIVE", "CLOSED"],
  ACTIVE: ["CLOSED"],
  CLOSED: [],
};

function validateTransition(from: SubscriptionStatus, to: SubscriptionStatus) {
  const allowed = VALID_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new AppError(
      `Cannot transition subscription from ${from} to ${to}`,
      400,
      "INVALID_STATUS_TRANSITION",
    );
  }
}

function buildPlanSnapshot(plan: {
  code: string;
  name: string;
  description: string | null;
  price: DecimalValue;
  currency: string;
  billingInterval: string;
  appLimit: number;
  customizationSlots: number;
  entitlements: Prisma.InputJsonValue | null;
}) {
  return {
    code: plan.code,
    name: plan.name,
    description: plan.description,
    price: plan.price.toString(),
    currency: plan.currency,
    billingInterval: plan.billingInterval,
    appLimit: plan.appLimit,
    customizationSlots: plan.customizationSlots,
    entitlements: plan.entitlements as Prisma.InputJsonValue,
  };
}

export const subscriptionService = {
  async list(tenantId: string) {
    const subscriptions = await prisma.subscription.findMany({
      where: { tenantId },
      include: { platformPlan: true },
      orderBy: { createdAt: "desc" },
    });
    return subscriptions;
  },

  async getById(tenantId: string, id: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { id, tenantId },
      include: { platformPlan: true },
    });
    if (!subscription) {
      throw new AppError("Subscription not found", 404, "NOT_FOUND");
    }
    return subscription;
  },

  async getActive(tenantId: string) {
    return prisma.subscription.findFirst({
      where: { tenantId, status: "ACTIVE" },
      include: { platformPlan: true },
    });
  },

  async create(tenantId: string, input: CreateSubscriptionInput) {
    const plan = await prisma.platformPlan.findUnique({
      where: { code: input.planCode },
    });
    if (!plan || !plan.isActive) {
      throw new AppError("Plan not found or inactive", 404, "PLAN_NOT_FOUND");
    }

    const quantity = input.quantity ?? 1;
    const unitPrice = plan.price;
    const totalPrice = unitPrice.mul(quantity);

    return prisma.subscription.create({
      data: {
        tenantId,
        platformPlanId: plan.id,
        status: "DRAFT",
        quantity,
        unitPriceSnapshot: unitPrice,
        priceSnapshot: totalPrice,
        currency: plan.currency,
        billingInterval: input.billingInterval ?? plan.billingInterval,
        customizationSlotsIncluded: plan.customizationSlots,
        planSnapshot: buildPlanSnapshot(plan),
      },
      include: { platformPlan: true },
    });
  },

  async update(tenantId: string, id: string, input: UpdateSubscriptionInput) {
    const existing = await prisma.subscription.findFirst({
      where: { id, tenantId },
      include: { platformPlan: true },
    });
    if (!existing) {
      throw new AppError("Subscription not found", 404, "NOT_FOUND");
    }
    if (!["DRAFT", "QUOTATION"].includes(existing.status)) {
      throw new AppError(
        "Only DRAFT or QUOTATION subscriptions can be updated",
        400,
        "INVALID_STATUS",
      );
    }

    const quantity = input.quantity ?? existing.quantity;
    const unitPrice = existing.unitPriceSnapshot;
    const totalPrice = unitPrice.mul(quantity);

    return prisma.subscription.update({
      where: { id },
      data: {
        quantity,
        priceSnapshot: totalPrice,
      },
      include: { platformPlan: true },
    });
  },

  async changePlan(tenantId: string, id: string, input: ChangeSubscriptionPlanInput) {
    const existing = await prisma.subscription.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new AppError("Subscription not found", 404, "NOT_FOUND");
    }
    if (existing.status === "CLOSED") {
      throw new AppError("Cannot change plan on a closed subscription", 400, "INVALID_STATUS");
    }

    const plan = await prisma.platformPlan.findUnique({
      where: { code: input.planCode },
    });
    if (!plan || !plan.isActive) {
      throw new AppError("Plan not found or inactive", 404, "PLAN_NOT_FOUND");
    }

    const quantity = input.quantity ?? existing.quantity;
    const unitPrice = plan.price;
    const totalPrice = unitPrice.mul(quantity);

    return prisma.subscription.update({
      where: { id },
      data: {
        platformPlanId: plan.id,
        quantity,
        unitPriceSnapshot: unitPrice,
        priceSnapshot: totalPrice,
        billingInterval: plan.billingInterval,
        customizationSlotsIncluded: plan.customizationSlots,
        planSnapshot: buildPlanSnapshot(plan),
      },
      include: { platformPlan: true },
    });
  },

  async transition(tenantId: string, id: string, toStatus: SubscriptionStatus) {
    const existing = await prisma.subscription.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new AppError("Subscription not found", 404, "NOT_FOUND");
    }
    validateTransition(existing.status, toStatus);

    const data: Record<string, unknown> = { status: toStatus };
    if (toStatus === "CLOSED") {
      data.canceledAt = new Date();
    }

    return prisma.subscription.update({ where: { id }, data, include: { platformPlan: true } });
  },

  async activate(
    tenantId: string,
    id: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.subscription.findFirst({
        where: { id, tenantId },
      });
      if (!existing) {
        throw new AppError("Subscription not found", 404, "NOT_FOUND");
      }
      validateTransition(existing.status, "ACTIVE");

      // Close any other active subscription for this tenant
      await tx.subscription.updateMany({
        where: {
          tenantId,
          status: "ACTIVE",
          id: { not: id },
        },
        data: { status: "CLOSED", canceledAt: new Date() },
      });

      const now = new Date();
      const endsAt = new Date(now);
      if (existing.billingInterval === "MONTHLY") {
        endsAt.setMonth(endsAt.getMonth() + 1);
      } else if (existing.billingInterval === "YEARLY") {
        endsAt.setFullYear(endsAt.getFullYear() + 1);
      }

      const activated = await tx.subscription.update({
        where: { id },
        data: {
          status: "ACTIVE",
          razorpayOrderId,
          razorpayPaymentId,
          startsAt: now,
          endsAt: existing.billingInterval === "ONE_TIME" ? null : endsAt,
        },
        include: { platformPlan: true },
      });

      // Log audit
      await tx.auditLog.create({
        data: {
          tenantId,
          action: "SUBSCRIPTION_ACTIVATED",
          entityId: id,
          entityType: "Subscription",
          metadata: { razorpayOrderId, razorpayPaymentId },
        },
      });

      return activated;
    });
  },

  async close(tenantId: string, id: string) {
    return this.transition(tenantId, id, "CLOSED");
  },

  async getPlans() {
    return prisma.platformPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
  },
};

