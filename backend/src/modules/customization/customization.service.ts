import { prisma } from "../../config/prisma.js";
import { AppError } from "../../shared/errors.js";
import { Decimal } from "../../shared/decimal.js";
import { walletService } from "../wallet/wallet.service.js";
import type { CreateCustomizationInput } from "./customization.validation.js";

const EXTRA_SLOT_PRICE = new Decimal(5000);

export const customizationService = {
  async list(tenantId: string) {
    return prisma.customization.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(tenantId: string, id: string) {
    const customization = await prisma.customization.findFirst({ where: { id, tenantId } });
    if (!customization) throw new AppError("Customization not found", 404, "NOT_FOUND");
    return customization;
  },

  async request(tenantId: string, input: CreateCustomizationInput) {
    return prisma.$transaction(async (tx) => {
      // Get active subscription
      const subscription = await tx.subscription.findFirst({
        where: { tenantId, status: "ACTIVE" },
      });
      if (!subscription) {
        throw new AppError("No active subscription found", 400, "NO_ACTIVE_SUBSCRIPTION");
      }

      // Count used customizations for the subscription period
      const usedCount = await tx.customization.count({
        where: {
          tenantId,
          status: { in: ["PENDING", "IN_PROGRESS", "COMPLETED"] },
          createdAt: { gte: subscription.startsAt },
        },
      });

      const slotsIncluded = subscription.customizationSlotsIncluded;
      const hasSlot = usedCount < slotsIncluded;
      const idempotencyKey = `CUSTOM:${tenantId}:${input.name}:${Date.now()}`;

      if (hasSlot) {
        return tx.customization.create({
          data: {
            tenantId,
            name: input.name,
            description: input.description,
            usedFromSlots: true,
            walletCharged: new Decimal(0),
            idempotencyKey,
          },
        });
      }

      // No slots available — charge wallet
      const wallet = await tx.wallet.findUnique({ where: { tenantId } });
      if (!wallet) throw new AppError("Wallet not found", 404, "NOT_FOUND");
      if (wallet.balance.lessThan(EXTRA_SLOT_PRICE)) {
        throw new AppError(
          "Insufficient wallet balance to purchase extra customization slot",
          400,
          "INSUFFICIENT_BALANCE",
        );
      }

      // Debit wallet (using the service but within the same tx via direct update)
      const walletIdempotencyKey = `CUSTOM_DEBIT:${tenantId}:${input.name}:${Date.now()}`;
      const existingTx = await tx.walletTransaction.findUnique({
        where: { idempotencyKey: walletIdempotencyKey },
      });
      if (!existingTx) {
        const newBalance = wallet.balance.sub(EXTRA_SLOT_PRICE);
        await tx.wallet.update({ where: { tenantId }, data: { balance: newBalance } });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            tenantId,
            type: "DEBIT",
            amount: EXTRA_SLOT_PRICE,
            balanceAfter: newBalance,
            idempotencyKey: walletIdempotencyKey,
            description: `Extra customization slot: ${input.name}`,
          },
        });
      }

      return tx.customization.create({
        data: {
          tenantId,
          name: input.name,
          description: input.description,
          usedFromSlots: false,
          walletCharged: EXTRA_SLOT_PRICE,
          idempotencyKey,
        },
      });
    });
  },
};
