import { prisma } from "../../config/prisma.js";
import { AppError } from "../../shared/errors.js";
import { Decimal } from "../../shared/decimal.js";
import type { CreateInvoiceInput, UpdateInvoiceInput, ListInvoicesInput } from "./invoice.validation.js";

function generateInvoiceNumber(count: number): string {
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count).padStart(4, "0")}`;
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
    return { amount };
  });

  const discount = new Decimal(discountAmount);
  const total = subtotal.add(taxAmount).sub(discount);

  return { subtotal, taxAmount, total, processedItems };
}

export const invoiceService = {
  async list(tenantId: string, filters?: ListInvoicesInput) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (filters?.status) where.status = filters.status;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { lineItems: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return { invoices, total, page, limit };
  },

  async getById(tenantId: string, id: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
      include: { lineItems: true },
    });
    if (!invoice) throw new AppError("Invoice not found", 404, "NOT_FOUND");
    return invoice;
  },

  async create(tenantId: string, input: CreateInvoiceInput) {
    return prisma.$transaction(async (tx) => {
      const count = await tx.invoice.count({ where: { tenantId } });
      const invoiceNumber = generateInvoiceNumber(count + 1);
      const idempotencyKey = `INV:${tenantId}:${Date.now()}`;

      const discountAmount = input.discountAmount ?? 0;
      const { subtotal, taxAmount, total, processedItems } = calculateTotals(
        input.lineItems,
        discountAmount,
      );

      return tx.invoice.create({
        data: {
          tenantId,
          subscriptionId: input.subscriptionId,
          quotationId: input.quotationId,
          invoiceNumber,
          idempotencyKey,
          subtotal,
          taxAmount,
          discountAmount: new Decimal(discountAmount),
          total,
          notes: input.notes,
          dueDate: input.dueDate,
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

  async update(tenantId: string, id: string, input: UpdateInvoiceInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.invoice.findFirst({ where: { id, tenantId } });
      if (!existing) throw new AppError("Invoice not found", 404, "NOT_FOUND");
      if (existing.status !== "DRAFT") {
        throw new AppError("Only DRAFT invoices can be updated", 400, "INVALID_STATUS");
      }

      const updateData: Record<string, unknown> = {};

      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
      if (input.subscriptionId !== undefined) updateData.subscriptionId = input.subscriptionId;
      if (input.quotationId !== undefined) updateData.quotationId = input.quotationId;

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

        await tx.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
        await tx.invoiceLineItem.createMany({
          data: input.lineItems.map((item, i) => ({
            invoiceId: id,
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

      return tx.invoice.update({
        where: { id },
        data: updateData,
        include: { lineItems: true },
      });
    });
  },

  async confirm(tenantId: string, id: string) {
    const existing = await prisma.invoice.findFirst({ where: { id, tenantId } });
    if (!existing) throw new AppError("Invoice not found", 404, "NOT_FOUND");
    if (existing.status !== "DRAFT") {
      throw new AppError("Only DRAFT invoices can be confirmed", 400, "INVALID_STATUS");
    }
    return prisma.invoice.update({
      where: { id },
      data: { status: "CONFIRMED" },
      include: { lineItems: true },
    });
  },

  async void(tenantId: string, id: string) {
    const existing = await prisma.invoice.findFirst({ where: { id, tenantId } });
    if (!existing) throw new AppError("Invoice not found", 404, "NOT_FOUND");
    if (!["DRAFT", "CONFIRMED"].includes(existing.status)) {
      throw new AppError("Only DRAFT or CONFIRMED invoices can be voided", 400, "INVALID_STATUS");
    }
    return prisma.invoice.update({
      where: { id },
      data: { status: "VOID" },
      include: { lineItems: true },
    });
  },
};
