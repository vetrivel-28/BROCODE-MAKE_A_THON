import { prisma } from "../../config/prisma.js";
import { AppError } from "../../shared/errors.js";
import { Decimal } from "../../shared/decimal.js";
import type { CreateProductInput, UpdateProductInput, ListProductsInput } from "./product.validation.js";

export const productService = {
  async list(tenantId: string, filters?: ListProductsInput) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive === "true";
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total, page, limit };
  },

  async getById(tenantId: string, id: string) {
    const product = await prisma.product.findFirst({ where: { id, tenantId } });
    if (!product) throw new AppError("Product not found", 404, "NOT_FOUND");
    return product;
  },

  async create(tenantId: string, input: CreateProductInput) {
    if (input.sku) {
      const existing = await prisma.product.findUnique({
        where: { tenantId_sku: { tenantId, sku: input.sku } },
      });
      if (existing) throw new AppError("A product with this SKU already exists", 409, "DUPLICATE_SKU");
    }

    return prisma.product.create({
      data: {
        tenantId,
        name: input.name,
        description: input.description,
        price: new Decimal(input.price),
        currency: input.currency ?? "INR",
        sku: input.sku,
      },
    });
  },

  async update(tenantId: string, id: string, input: UpdateProductInput) {
    const existing = await prisma.product.findFirst({ where: { id, tenantId } });
    if (!existing) throw new AppError("Product not found", 404, "NOT_FOUND");

    if (input.sku && input.sku !== existing.sku) {
      const duplicate = await prisma.product.findUnique({
        where: { tenantId_sku: { tenantId, sku: input.sku } },
      });
      if (duplicate) throw new AppError("A product with this SKU already exists", 409, "DUPLICATE_SKU");
    }

    return prisma.product.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        price: input.price !== undefined ? new Decimal(input.price) : undefined,
        currency: input.currency,
        sku: input.sku,
      },
    });
  },

  async archive(tenantId: string, id: string) {
    const existing = await prisma.product.findFirst({ where: { id, tenantId } });
    if (!existing) throw new AppError("Product not found", 404, "NOT_FOUND");
    return prisma.product.update({ where: { id }, data: { isActive: false } });
  },
};
