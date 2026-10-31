import { prisma } from "../../config/prisma.js";
import { AppError } from "../../shared/errors.js";
import { Decimal, type DecimalValue } from "../../shared/decimal.js";
import type { CreateDiscountInput, UpdateDiscountInput } from "./discount.validation.js";

export const discountService = {
  async list(tenantId: string) {
    return prisma.discount.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(tenantId: string, input: CreateDiscountInput) {
    const existing = await prisma.discount.findUnique({
      where: { tenantId_code: { tenantId, code: input.code } },
    });
    if (existing) throw new AppError("A discount with this code already exists", 409, "DUPLICATE_CODE");

    return prisma.discount.create({
      data: {
        tenantId,
        code: input.code,
        name: input.name,
        type: input.type,
        value: new Decimal(input.value),
        maxUses: input.maxUses,
        validUntil: input.validUntil,
      },
    });
  },

  async update(tenantId: string, id: string, input: UpdateDiscountInput) {
    const existing = await prisma.discount.findFirst({ where: { id, tenantId } });
    if (!existing) throw new AppError("Discount not found", 404, "NOT_FOUND");

    return prisma.discount.update({
      where: { id },
      data: {
        name: input.name,
        isActive: input.isActive,
        validUntil: input.validUntil,
      },
    });
  },

  async toggle(tenantId: string, id: string) {
    const existing = await prisma.discount.findFirst({ where: { id, tenantId } });
    if (!existing) throw new AppError("Discount not found", 404, "NOT_FOUND");
    return prisma.discount.update({ where: { id }, data: { isActive: !existing.isActive } });
  },

  calculateDiscount(discount: { type: string; value: DecimalValue }, subtotal: DecimalValue): DecimalValue {
    if (discount.type === "FIXED") {
      return discount.value.greaterThan(subtotal) ? subtotal : discount.value;
    }
    // PERCENTAGE
    return subtotal.mul(discount.value).div(100).toDecimalPlaces(4);
  },

  async validate(tenantId: string, code: string, subtotal: number) {
    const discount = await prisma.discount.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });

    if (!discount) throw new AppError("Discount code not found", 404, "NOT_FOUND");
    if (!discount.isActive) throw new AppError("Discount code is inactive", 400, "DISCOUNT_INACTIVE");

    const now = new Date();
    if (discount.validUntil && discount.validUntil < now) {
      throw new AppError("Discount code has expired", 400, "DISCOUNT_EXPIRED");
    }
    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      throw new AppError("Discount code has reached its maximum uses", 400, "DISCOUNT_EXHAUSTED");
    }

    const subtotalDecimal = new Decimal(subtotal);
    const calculatedAmount = this.calculateDiscount(
      { type: discount.type, value: discount.value },
      subtotalDecimal,
    );

    return { discount, calculatedAmount };
  },
};
