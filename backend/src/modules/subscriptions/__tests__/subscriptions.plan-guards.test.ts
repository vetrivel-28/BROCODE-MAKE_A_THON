import { describe, expect, it } from 'vitest';
import { assertPlanSelectionAllowed } from '../subscriptions.plan-guards.js';

describe('subscription plan selection guards', () => {
  const now = new Date('2026-10-31T12:00:00.000Z');
  const plan = {
    minimumQuantity: 3,
    availableFrom: new Date('2026-11-01T00:00:00.000Z'),
    availableUntil: new Date('2026-12-31T23:59:59.999Z'),
  };

  it('accepts a start date within availability at or above the minimum', () => {
    expect(() => assertPlanSelectionAllowed(plan, new Date('2026-11-01T00:00:00.000Z'), 3, now)).not.toThrow();
    expect(() => assertPlanSelectionAllowed(plan, new Date('2026-12-01T00:00:00.000Z'), 5, now)).not.toThrow();
  });

  it('rejects quantities below minimum and non-whole quantities', () => {
    expect(() => assertPlanSelectionAllowed(plan, new Date('2026-11-01T00:00:00.000Z'), 2, now))
      .toThrow('Minimum plan quantity is not met');
    expect(() => assertPlanSelectionAllowed(plan, new Date('2026-11-01T00:00:00.000Z'), 3.5, now))
      .toThrow('Minimum plan quantity is not met');
  });

  it('rejects starts before or after plan availability and dates in the past', () => {
    expect(() => assertPlanSelectionAllowed(plan, new Date('2026-10-31T23:59:59.999Z'), 3, now))
      .toThrow('Plan is unavailable on the requested start date');
    expect(() => assertPlanSelectionAllowed(plan, new Date('2027-01-01T00:00:00.000Z'), 3, now))
      .toThrow('Plan is unavailable on the requested start date');
    expect(() => assertPlanSelectionAllowed(plan, new Date('2026-10-30T00:00:00.000Z'), 3, now))
      .toThrow('Subscription start date cannot be in the past');
  });
});
