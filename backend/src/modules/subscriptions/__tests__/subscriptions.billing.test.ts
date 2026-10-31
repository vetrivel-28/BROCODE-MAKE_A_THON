import { describe, expect, it } from 'vitest';
import { nextInvoiceDate } from '../subscriptions.billing.js';

describe('invoice calendar advancement', () => {
  it('clamps month-end billing to the last day of the next month', () => {
    expect(nextInvoiceDate(new Date('2025-01-31T12:30:00.000Z'), 'MONTHLY').toISOString())
      .toBe('2025-02-28T12:30:00.000Z');
    expect(nextInvoiceDate(new Date('2024-01-31T12:30:00.000Z'), 'MONTHLY').toISOString())
      .toBe('2024-02-29T12:30:00.000Z');
  });

  it('advances daily, weekly, and yearly periods without losing time of day', () => {
    expect(nextInvoiceDate(new Date('2024-02-29T08:15:00.000Z'), 'DAILY').toISOString())
      .toBe('2024-03-01T08:15:00.000Z');
    expect(nextInvoiceDate(new Date('2024-02-29T08:15:00.000Z'), 'WEEKLY').toISOString())
      .toBe('2024-03-07T08:15:00.000Z');
    expect(nextInvoiceDate(new Date('2024-02-29T08:15:00.000Z'), 'YEARLY').toISOString())
      .toBe('2025-02-28T08:15:00.000Z');
  });
});
