import { prisma } from "../../config/prisma.js";
import { Decimal, type DecimalValue } from "../../shared/decimal.js";

export const insightsService = {
  async getInsights(tenantId: string) {
    const now = new Date();

    // Total customers (users in this tenant)
    const totalCustomers = await prisma.user.count({ where: { tenantId } });

    // Active subscription
    const activeSubscription = await prisma.subscription.findFirst({
      where: { tenantId, status: "ACTIVE" },
      include: { platformPlan: true },
    });

    // Subscription history
    const subscriptionHistory = await prisma.subscription.findMany({
      where: { tenantId },
      include: { platformPlan: true },
      orderBy: { createdAt: "desc" },
    });

    // Invoice counts by status
    const invoiceStatusCounts = await prisma.invoice.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { id: true },
    });
    const totalInvoices: Record<string, number> = {};
    for (const row of invoiceStatusCounts) {
      totalInvoices[row.status] = row._count.id;
    }

    // Revenue
    const paidAgg = await prisma.invoice.aggregate({
      where: { tenantId, status: "PAID" },
      _sum: { total: true },
    });
    const pendingAgg = await prisma.invoice.aggregate({
      where: { tenantId, status: "CONFIRMED" },
      _sum: { total: true },
    });

    const paidRevenue = paidAgg._sum.total ?? new Decimal(0);
    const pendingRevenue = pendingAgg._sum.total ?? new Decimal(0);

    // Recent wallet transactions
    const recentTransactions = await prisma.walletTransaction.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Customization usage
    const usedCustomizations = activeSubscription
      ? await prisma.customization.count({
          where: {
            tenantId,
            status: { in: ["PENDING", "IN_PROGRESS", "COMPLETED"] },
            createdAt: { gte: activeSubscription.startsAt },
          },
        })
      : 0;
    const customizationSlotsAvailable = activeSubscription?.customizationSlotsIncluded ?? 0;

    // Monthly data: last 6 months
    const monthlyData: Array<{
      month: string;
      year: number;
      invoiceCount: number;
      amountPaid: DecimalValue;
    }> = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const [count, sumAgg] = await Promise.all([
        prisma.invoice.count({
          where: { tenantId, createdAt: { gte: start, lt: end } },
        }),
        prisma.invoice.aggregate({
          where: { tenantId, status: "PAID", createdAt: { gte: start, lt: end } },
          _sum: { total: true },
        }),
      ]);

      monthlyData.push({
        month: start.toLocaleString("default", { month: "long" }),
        year: start.getFullYear(),
        invoiceCount: count,
        amountPaid: sumAgg._sum.total ?? new Decimal(0),
      });
    }

    return {
      totalCustomers,
      activeSubscription,
      subscriptionHistory,
      totalInvoices,
      paidRevenue,
      pendingRevenue,
      recentTransactions,
      customizationUsage: {
        used: usedCustomizations,
        available: customizationSlotsAvailable,
      },
      monthlyData,
    };
  },
};
