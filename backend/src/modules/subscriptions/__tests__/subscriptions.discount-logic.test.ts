import { describe, expect, it } from 'vitest';
import {
  calculateDiscountAmount,
  isDiscountEligible,
} from '../subscriptions.discount-logic.js';

describe('pure discount calculations', () => {
  const startsAt = new Date('2026-10-01T00:00:00.000Z');
  const base = {
    startsAt,
    endsAt: new Date('2026-10-31T23:59:59.999Z'),
    usageLimit: 4,
    usageCount: 3,
    minimumPurchase: '100.00',
    minimumQuantity: 5,
    periodStart: new Date('2026-10-15T00:00:00.000Z'),
    purchaseAmount: '100.00',
    quantity: 5,
  };

  it('accepts inclusive date and threshold boundaries', () => {
    expect(isDiscountEligible(base)).toBe(true);
    expect(isDiscountEligible({ ...base, periodStart: startsAt })).toBe(true);
    expect(isDiscountEligible({ ...base, periodStart: base.endsAt! })).toBe(true);
  });

  it('rejects invalid date windows, exhausted limits, and unmet minimums', () => {
    expect(isDiscountEligible({ ...base, periodStart: new Date('2026-09-30T23:59:59.999Z') })).toBe(false);
    expect(isDiscountEligible({ ...base, periodStart: new Date('2026-11-01T00:00:00.000Z') })).toBe(false);
    expect(isDiscountEligible({ ...base, usageCount: 4 })).toBe(false);
    expect(isDiscountEligible({ ...base, purchaseAmount: '99.99' })).toBe(false);
    expect(isDiscountEligible({ ...base, quantity: 4 })).toBe(false);
  });

  it('caps fixed and percent discounts to the eligible amount', () => {
    expect(calculateDiscountAmount('1250.00', 'PERCENT', '10.00')).toBe('125.00');
    expect(calculateDiscountAmount('1250.00', 'FIXED', '1500.00')).toBe('1250.00');
  });
});
