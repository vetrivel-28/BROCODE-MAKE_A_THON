import { describe, expect, it, vi } from 'vitest';
import {
  getDiscountPurchaseBase,
  isDiscountEligible,
  recordDiscountUsage,
} from '../subscriptions.discounts.js';
import type { TenantTransaction } from '../subscriptions.types.js';

describe('discount eligibility', () => {
  const periodStart = new Date('2026-10-01T00:00:00.000Z');

  it('matches date window, purchase, quantity, and remaining usage capacity', () => {
    expect(isDiscountEligible({
      startsAt: new Date('2026-09-01T00:00:00.000Z'),
      endsAt: new Date('2026-11-01T00:00:00.000Z'),
      usageLimit: 10,
      usageCount: 9,
      minimumPurchase: '100.00',
      minimumQuantity: 5,
      periodStart,
      purchaseAmount: '150.00',
      quantity: 5,
    })).toBe(true);
  });

  describe('discount usage recording', () => {
    it('is idempotent for the same invoice', async () => {
      const updateMany = vi.fn();
      const tx = {
        tenantId: 'tenant-1',
        prisma: {
          discountRule: {
            findFirst: vi.fn().mockResolvedValue({ id: 'discount-1', usageCount: 2, usageLimit: 5 }),
            findFirstOrThrow: vi.fn().mockResolvedValue({ usageCount: 2 }),
            updateMany,
          },
          invoice: { findFirst: vi.fn().mockResolvedValue({ id: 'invoice-1' }) },
          discountUsage: { createMany: vi.fn().mockResolvedValue({ count: 0 }) },
        },
      } as unknown as TenantTransaction;

      await expect(recordDiscountUsage(tx, 'discount-1', 'invoice-1')).resolves.toEqual({
        recorded: false,
        usageCount: 2,
      });
      expect(updateMany).not.toHaveBeenCalled();
    });

    it('increments usage with an atomic remaining-limit condition', async () => {
      const updateMany = vi.fn().mockResolvedValue({ count: 1 });
      const tx = {
        tenantId: 'tenant-1',
        prisma: {
          discountRule: {
            findFirst: vi.fn().mockResolvedValue({ id: 'discount-1', usageCount: 2, usageLimit: 5 }),
            findFirstOrThrow: vi.fn().mockResolvedValue({ usageCount: 3 }),
            updateMany,
          },
          invoice: { findFirst: vi.fn().mockResolvedValue({ id: 'invoice-1' }) },
          discountUsage: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
        },
      } as unknown as TenantTransaction;

      await expect(recordDiscountUsage(tx, 'discount-1', 'invoice-1')).resolves.toEqual({
        recorded: true,
        usageCount: 3,
      });
      expect(updateMany).toHaveBeenCalledWith({
        where: { id: 'discount-1', tenantId: 'tenant-1', usageCount: { lt: 5 } },
        data: { usageCount: { increment: 1 } },
      });
    });
  });

  it('rejects discounts outside dates, below thresholds, or at the usage limit', () => {
    const base = {
      startsAt: new Date('2026-09-01T00:00:00.000Z'),
      endsAt: null,
      usageLimit: 2,
      usageCount: 1,
      minimumPurchase: '100.00',
      minimumQuantity: 4,
      periodStart,
      purchaseAmount: '150.00',
      quantity: 5,
    };
    expect(isDiscountEligible({ ...base, periodStart: new Date('2026-08-01T00:00:00.000Z') })).toBe(false);
    expect(isDiscountEligible({ ...base, purchaseAmount: '99.00' })).toBe(false);
    expect(isDiscountEligible({ ...base, quantity: 3 })).toBe(false);
    expect(isDiscountEligible({ ...base, usageCount: 2 })).toBe(false);
  });

  it('selects product-targeted or full subscription purchase bases', () => {
    const lines = [
      { productId: 'product-a', quantity: 2, amount: '25.50' },
      { productId: 'product-b', quantity: 3, amount: '100.00' },
    ];
    expect(getDiscountPurchaseBase('PRODUCTS', ['product-a'], lines, '580.00', 5))
      .toEqual({ purchaseAmount: '25.50', quantity: 2 });
    expect(getDiscountPurchaseBase('PRODUCTS', ['missing'], lines, '580.00', 5)).toBeNull();
    expect(getDiscountPurchaseBase('SUBSCRIPTIONS', [], lines, '580.00', 5))
      .toEqual({ purchaseAmount: '3025.50', quantity: 5 });
  });
});
