/**
 * Clock utility to provide deterministic time across LoopDesk.
 * Never call `new Date()` directly.
 * In non-production, supports `x-test-date` request header or manual test override.
 */
let overriddenTestDate: Date | null = null;

export const clock = {
  now(testDateHeader?: string | null): Date {
    if (process.env.NODE_ENV !== 'production') {
      if (testDateHeader) {
        const parsed = new Date(testDateHeader);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
      if (overriddenTestDate) {
        return new Date(overriddenTestDate);
      }
    }
    return new Date();
  },

  setTestDate(date: Date | string | null): void {
    if (date === null) {
      overriddenTestDate = null;
    } else {
      overriddenTestDate = typeof date === 'string' ? new Date(date) : date;
    }
  },

  reset(): void {
    overriddenTestDate = null;
  }
};

