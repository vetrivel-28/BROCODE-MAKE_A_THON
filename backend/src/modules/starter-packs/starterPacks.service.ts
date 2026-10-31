import { prisma } from "../../config/prisma.js";
import { AppError } from "../../shared/errors.js";

const STARTER_PACKS = {
  retail: {
    industry: "Retail",
    products: [
      { name: "Basic POS Setup", description: "Point of sale system setup", price: 9999, sku: "RET-POS-001" },
      { name: "Inventory Management", description: "Stock tracking module", price: 4999, sku: "RET-INV-001" },
      { name: "Customer Loyalty Program", description: "Loyalty rewards system", price: 2999, sku: "RET-LOY-001" },
    ],
    taxes: [
      { name: "GST 18%", rate: 18, description: "Goods and Services Tax" },
      { name: "GST 12%", rate: 12, description: "Goods and Services Tax - Reduced" },
    ],
    discounts: [
      { code: "WELCOME10", name: "Welcome Discount", type: "PERCENTAGE" as const, value: 10 },
      { code: "BULK500", name: "Bulk Order Discount", type: "FIXED" as const, value: 500 },
    ],
  },
  saas: {
    industry: "SaaS",
    products: [
      { name: "Starter Plan Implementation", description: "Basic SaaS onboarding", price: 14999, sku: "SAAS-STR-001" },
      { name: "API Integration Service", description: "Custom API integration", price: 29999, sku: "SAAS-API-001" },
      { name: "Data Migration", description: "One-time data migration service", price: 19999, sku: "SAAS-MIG-001" },
    ],
    taxes: [
      { name: "GST 18%", rate: 18, description: "Goods and Services Tax" },
    ],
    discounts: [
      { code: "ANNUAL20", name: "Annual Plan Discount", type: "PERCENTAGE" as const, value: 20 },
      { code: "PARTNER15", name: "Partner Discount", type: "PERCENTAGE" as const, value: 15 },
    ],
  },
  gym: {
    industry: "Gym",
    products: [
      { name: "Monthly Membership", description: "Single gym membership per month", price: 1999, sku: "GYM-MEM-M" },
      { name: "Personal Training Session", description: "1 hour personal training", price: 999, sku: "GYM-PT-001" },
      { name: "Annual Membership", description: "Full year gym access", price: 18000, sku: "GYM-MEM-A" },
    ],
    taxes: [
      { name: "GST 18%", rate: 18, description: "Goods and Services Tax on fitness services" },
    ],
    discounts: [
      { code: "FIRSTMONTH", name: "First Month Free", type: "FIXED" as const, value: 1999 },
      { code: "FAMILY25", name: "Family Plan Discount", type: "PERCENTAGE" as const, value: 25 },
    ],
  },
  coaching: {
    industry: "Coaching",
    products: [
      { name: "1-on-1 Coaching Session", description: "60 minute coaching session", price: 2999, sku: "COACH-1ON1" },
      { name: "Group Workshop", description: "Group coaching session", price: 999, sku: "COACH-GRP-001" },
      { name: "Coaching Package (10 sessions)", description: "10 session bundle", price: 24999, sku: "COACH-PKG-10" },
    ],
    taxes: [
      { name: "GST 18%", rate: 18, description: "Goods and Services Tax" },
    ],
    discounts: [
      { code: "EARLYBIRD", name: "Early Bird Discount", type: "PERCENTAGE" as const, value: 20 },
      { code: "BUNDLE30", name: "Bundle Discount", type: "PERCENTAGE" as const, value: 30 },
    ],
  },
};

export type StarterPackIndustry = keyof typeof STARTER_PACKS;

export const starterPackService = {
  async apply(tenantId: string, industry: StarterPackIndustry) {
    const pack = STARTER_PACKS[industry];
    if (!pack) {
      throw new AppError(`Unknown starter pack: ${industry}`, 400, "UNKNOWN_PACK");
    }

    // Check if already applied - look for products with pack-specific SKUs
    const existingProduct = await prisma.product.findFirst({
      where: {
        tenantId,
        sku: { in: pack.products.map((p) => p.sku) },
      },
    });
    if (existingProduct) {
      throw new AppError(
        "This starter pack has already been applied to your tenant",
        409,
        "PACK_ALREADY_APPLIED",
      );
    }

    await prisma.$transaction(async (tx) => {
      // Update tenant industry
      await tx.tenant.update({
        where: { id: tenantId },
        data: { industry: pack.industry },
      });

      // Create products
      for (const product of pack.products) {
        await tx.product.upsert({
          where: { tenantId_sku: { tenantId, sku: product.sku } },
          update: {},
          create: {
            tenantId,
            name: product.name,
            description: product.description,
            price: product.price,
            currency: "INR",
            sku: product.sku,
            isActive: true,
          },
        });
      }

      // Create taxes
      for (const tax of pack.taxes) {
        const existing = await tx.tax.findFirst({
          where: { tenantId, name: tax.name },
        });
        if (!existing) {
          await tx.tax.create({
            data: { tenantId, name: tax.name, rate: tax.rate, description: tax.description, isActive: true },
          });
        }
      }

      // Create discounts
      for (const discount of pack.discounts) {
        const existing = await tx.discount.findFirst({
          where: { tenantId, code: discount.code },
        });
        if (!existing) {
          await tx.discount.create({
            data: {
              tenantId,
              code: discount.code,
              name: discount.name,
              type: discount.type,
              value: discount.value,
              isActive: true,
            },
          });
        }
      }
    });

    return { industry: pack.industry, applied: true };
  },

  getAvailablePacks() {
    return Object.entries(STARTER_PACKS).map(([key, value]) => ({
      id: key,
      industry: value.industry,
      productCount: value.products.length,
      taxCount: value.taxes.length,
      discountCount: value.discounts.length,
    }));
  },
};

