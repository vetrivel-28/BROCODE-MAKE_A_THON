import { prisma } from "../../config/prisma.js";
import { AppError } from "../../shared/errors.js";
import { Decimal } from "../../shared/decimal.js";
import type { CreateQuotationInput, UpdateQuotationInput } from "./quotation.validation.js";

function generateQuotationNumber(count: number): string {
  const year = new Date().getFullYear();
  return `Q-${year}-${String(count).padStart(4, "0")}`;
}

function calculateTotals(
  lineItems: { quantity: number; unitPrice: number; taxRate?: number }[],
  discountAmount: number,
) {
  let subtotal = new Decimal(0);
  let taxAmount = new Decimal(0);

  const processedItems = lineItems.map((item) => {
    const qty = new Decimal(item.quantity);
    const price = new Decimal(item.unitPrice);
    const amount = qty.mul(price);
    const rate = new Decimal(item.taxRate ?? 0);
    const tax = amount.mul(rate).div(100);
    subtotal = subtotal.add(amount);
    taxAmount = taxAmount.add(tax);
    return { amount, taxAmount: tax };
  });

  const discount = new Decimal(discountAmount);
  const total = subtotal.add(taxAmount).sub(discount);

  return { subtotal, taxAmount, total, processedItems };
}

export const quotationService = {
  async list(tenantId: string) {
    return prisma.quotation.findMany({
      where: { tenantId },
      include: { lineItems: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(tenantId: string, id: string) {
    const quotation = await prisma.quotation.findFirst({
      where: { id, tenantId },
      include: { lineItems: true },
    });
    if (!quotation) {
      throw new AppError("Quotation not found", 404, "NOT_FOUND");
    }
    return quotation;
  },

  async create(tenantId: string, input: CreateQuotationInput) {
    return prisma.$transaction(async (tx) => {
      const count = await tx.quotation.count({ where: { tenantId } });
      const quotationNumber = generateQuotationNumber(count + 1);

      const discountAmount = input.discountAmount ?? 0;
      const { subtotal, taxAmount, total, processedItems } = calculateTotals(
        input.lineItems,
        discountAmount,
      );

      return tx.quotation.create({
        data: {
          tenantId,
          subscriptionId: input.subscriptionId,
          quotationNumber,
          subtotal,
          taxAmount,
          discountAmount: new Decimal(discountAmount),
          total,
          notes: input.notes,
          validUntil: input.validUntil,
          lineItems: {
            create: input.lineItems.map((item, i) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: new Decimal(item.unitPrice),
              amount: processedItems[i]!.amount,
              taxRate: new Decimal(item.taxRate ?? 0),
            })),
          },
        },
        include: { lineItems: true },
      });
    });
  },

  async update(tenantId: string, id: string, input: UpdateQuotationInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.quotation.findFirst({ where: { id, tenantId } });
      if (!existing) throw new AppError("Quotation not found", 404, "NOT_FOUND");
      if (existing.status !== "DRAFT") {
        throw new AppError("Only DRAFT quotations can be updated", 400, "INVALID_STATUS");
      }

      const updateData: Record<string, unknown> = {};

      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.validUntil !== undefined) updateData.validUntil = input.validUntil;
      if (input.subscriptionId !== undefined) updateData.subscriptionId = input.subscriptionId;

      if (input.lineItems) {
        const discountAmount = input.discountAmount ?? existing.discountAmount.toNumber();
        const { subtotal, taxAmount, total, processedItems } = calculateTotals(
          input.lineItems,
          discountAmount,
        );
        updateData.subtotal = subtotal;
        updateData.taxAmount = taxAmount;
        updateData.total = total;
        updateData.discountAmount = new Decimal(discountAmount);

        await tx.quotationLineItem.deleteMany({ where: { quotationId: id } });
        await tx.quotationLineItem.createMany({
          data: input.lineItems.map((item, i) => ({
            quotationId: id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice),
            amount: processedItems[i]!.amount,
            taxRate: new Decimal(item.taxRate ?? 0),
          })),
        });
      } else if (input.discountAmount !== undefined) {
        const discount = new Decimal(input.discountAmount);
        updateData.discountAmount = discount;
        updateData.total = existing.subtotal.add(existing.taxAmount).sub(discount);
      }

      return tx.quotation.update({
        where: { id },
        data: updateData,
        include: { lineItems: true },
      });
    });
  },

  async confirm(tenantId: string, id: string) {
    const existing = await prisma.quotation.findFirst({ where: { id, tenantId } });
    if (!existing) throw new AppError("Quotation not found", 404, "NOT_FOUND");
    if (!["DRAFT", "SENT"].includes(existing.status)) {
      throw new AppError("Only DRAFT or SENT quotations can be confirmed", 400, "INVALID_STATUS");
    }
    return prisma.quotation.update({
      where: { id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
      include: { lineItems: true },
    });
  },

  async send(tenantId: string, id: string) {
    const existing = await prisma.quotation.findFirst({ where: { id, tenantId } });
    if (!existing) throw new AppError("Quotation not found", 404, "NOT_FOUND");
    if (existing.status !== "DRAFT") {
      throw new AppError("Only DRAFT quotations can be sent", 400, "INVALID_STATUS");
    }
    return prisma.quotation.update({
      where: { id },
      data: { status: "SENT" },
      include: { lineItems: true },
    });
  },

  async reject(tenantId: string, id: string) {
    const existing = await prisma.quotation.findFirst({ where: { id, tenantId } });
    if (!existing) throw new AppError("Quotation not found", 404, "NOT_FOUND");
    if (existing.status !== "CONFIRMED") {
      throw new AppError("Only CONFIRMED quotations can be rejected", 400, "INVALID_STATUS");
    }
    return prisma.quotation.update({
      where: { id },
      data: { status: "REJECTED", rejectedAt: new Date() },
      include: { lineItems: true },
    });
  },
};
