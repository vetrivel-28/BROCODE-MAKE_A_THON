import { prisma } from "../../config/prisma.js";
import { AppError } from "../../shared/errors.js";
import { Decimal } from "../../shared/decimal.js";
import type { CreateTaxInput, UpdateTaxInput } from "./tax.validation.js";

export const taxService = {
  async list(tenantId: string) {
    return prisma.tax.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(tenantId: string, input: CreateTaxInput) {
    const existing = await prisma.tax.findUnique({
      where: { tenantId_name: { tenantId, name: input.name } },
    });
    if (existing) throw new AppError("A tax with this name already exists", 409, "DUPLICATE_NAME");

    return prisma.tax.create({
      data: {
        tenantId,
        name: input.name,
        rate: new Decimal(input.rate),
        description: input.description,
      },
    });
  },

  async update(tenantId: string, id: string, input: UpdateTaxInput) {
    const existing = await prisma.tax.findFirst({ where: { id, tenantId } });
    if (!existing) throw new AppError("Tax not found", 404, "NOT_FOUND");

    if (input.name && input.name !== existing.name) {
      const duplicate = await prisma.tax.findUnique({
        where: { tenantId_name: { tenantId, name: input.name } },
      });
      if (duplicate) throw new AppError("A tax with this name already exists", 409, "DUPLICATE_NAME");
    }

    return prisma.tax.update({
      where: { id },
      data: {
        name: input.name,
        rate: input.rate !== undefined ? new Decimal(input.rate) : undefined,
        description: input.description,
      },
    });
  },

  async toggle(tenantId: string, id: string) {
    const existing = await prisma.tax.findFirst({ where: { id, tenantId } });
    if (!existing) throw new AppError("Tax not found", 404, "NOT_FOUND");
    return prisma.tax.update({ where: { id }, data: { isActive: !existing.isActive } });
  },
};
