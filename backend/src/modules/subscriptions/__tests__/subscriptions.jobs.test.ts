import { describe, expect, it } from 'vitest';
import { nextSubscriptionAutoCloseAt } from '../subscriptions.jobs.logic.js';

describe('subscription auto-close schedule', () => {
  it('schedules the next run at 02:00 UTC, moving to tomorrow after the run', () => {
    expect(nextSubscriptionAutoCloseAt(new Date('2026-10-31T01:59:00.000Z')).toISOString())
      .toBe('2026-10-31T02:00:00.000Z');
    expect(nextSubscriptionAutoCloseAt(new Date('2026-10-31T02:00:00.000Z')).toISOString())
      .toBe('2026-11-01T02:00:00.000Z');
    expect(nextSubscriptionAutoCloseAt(new Date('2026-12-31T23:59:00.000Z')).toISOString())
      .toBe('2027-01-01T02:00:00.000Z');
  });
});
