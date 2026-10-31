import { prisma } from "../../config/prisma.js";
import { AppError } from "../../shared/errors.js";
import { Decimal, type DecimalValue } from "../../shared/decimal.js";

export const walletService = {
  async get(tenantId: string) {
    const wallet = await prisma.wallet.findUnique({ where: { tenantId } });
    if (!wallet) throw new AppError("Wallet not found", 404, "NOT_FOUND");
    return wallet;
  },

  async getTransactions(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const wallet = await prisma.wallet.findUnique({ where: { tenantId } });
    if (!wallet) throw new AppError("Wallet not found", 404, "NOT_FOUND");

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.walletTransaction.count({ where: { tenantId } }),
    ]);

    return { transactions, total, page, limit };
  },

  async credit(
    tenantId: string,
    amount: DecimalValue,
    description: string,
    idempotencyKey: string,
  ) {
    return prisma.$transaction(async (tx) => {
      // Check idempotency
      const existing = await tx.walletTransaction.findUnique({ where: { idempotencyKey } });
      if (existing) return existing;

      const wallet = await tx.wallet.findUnique({ where: { tenantId } });
      if (!wallet) throw new AppError("Wallet not found", 404, "NOT_FOUND");

      const newBalance = wallet.balance.add(amount);

      await tx.wallet.update({
        where: { tenantId },
        data: { balance: newBalance },
      });

      return tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          tenantId,
          type: "CREDIT",
          amount,
          balanceAfter: newBalance,
          idempotencyKey,
          description,
        },
      });
    });
  },

  async debit(
    tenantId: string,
    amount: DecimalValue,
    description: string,
    idempotencyKey: string,
  ) {
    return prisma.$transaction(async (tx) => {
      // Check idempotency
      const existing = await tx.walletTransaction.findUnique({ where: { idempotencyKey } });
      if (existing) return existing;

      const wallet = await tx.wallet.findUnique({ where: { tenantId } });
      if (!wallet) throw new AppError("Wallet not found", 404, "NOT_FOUND");

      if (wallet.balance.lessThan(amount)) {
        throw new AppError("Insufficient wallet balance", 400, "INSUFFICIENT_BALANCE");
      }

      const newBalance = wallet.balance.sub(amount);

      await tx.wallet.update({
        where: { tenantId },
        data: { balance: newBalance },
      });

      return tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          tenantId,
          type: "DEBIT",
          amount,
          balanceAfter: newBalance,
          idempotencyKey,
          description,
        },
      });
    });
  },
};
