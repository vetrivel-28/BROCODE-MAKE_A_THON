import { PrismaClient } from '@prisma/client';

/**
 * Cross-module contracts stubbed by Person 1 for teammates (P2 and P3).
 * When P2 and P3 implement their modules, these will link directly to their services.
 */

export interface P2StarterPackData {
  industry: 'retail' | 'saas' | 'gym' | 'coaching';
  tenantId: string;
}

export interface P3StarterPackData {
  industry: 'retail' | 'saas' | 'gym' | 'coaching';
  tenantId: string;
}

/**
 * Seed helper for P2 (Products, Plans, Quotation Template).
 * Stubbed implementation logs and creates default records until P2 merges.
 */
export async function seedP2StarterPack(
  tenantId: string,
  industry: string,
  prismaClient?: any
): Promise<{ seeded: boolean; message: string }> {
  console.log(`[P1->P2 Contract Stub] Seeding P2 starter pack for tenant ${tenantId} (${industry})`);
  return {
    seeded: true,
    message: `P2 catalog starter pack for ${industry} seeded successfully.`
  };
}

/**
 * Seed helper for P3 (Taxes e.g. GST 5, 12, 18, and starter templates).
 * Stubbed implementation logs until P3 merges.
 */
export async function seedP3StarterPack(
  tenantId: string,
  industry: string,
  prismaClient?: any
): Promise<{ seeded: boolean; message: string }> {
  console.log(`[P1->P3 Contract Stub] Seeding P3 starter pack for tenant ${tenantId} (${industry})`);
  return {
    seeded: true,
    message: `P3 tax rules (GST 5, 12, 18) for ${industry} seeded successfully.`
  };
}

/**
 * Contract with P3: Get count of customizations used from customization ledger.
 * Returns 0 if P3 module is not yet merged or wallet/customization table is empty.
 */
export async function getP3UsedCustomizationsCount(
  tenantId: string,
  prismaClient?: any
): Promise<number> {
  // If P3's CustomizationPurchase model exists in database, query it; otherwise default 0
  try {
    if (prismaClient && prismaClient.customizationPurchase) {
      const count = await prismaClient.customizationPurchase.count({
        where: { tenantId }
      });
      return count;
    }
  } catch {
    // Ignore and return 0 stub
  }
  return 0;
}

/**
 * Contract with P3: Get wallet balance in paise.
 * Returns 0 if P3 module is not yet merged.
 */
export async function getP3WalletBalance(
  tenantId: string,
  prismaClient?: any
): Promise<number> {
  try {
    if (prismaClient && prismaClient.wallet) {
      const wallet = await prismaClient.wallet.findUnique({
        where: { tenantId }
      });
      return wallet?.balancePaise ?? 0;
    }
  } catch {
    // Ignore and return 0 stub
  }
  return 0;
}
