import { Request } from 'express';

class ClockService {
  private manualTestDate: Date | null = null;

  /**
   * Set a fixed date for testing purposes (non-production only)
   */
  public setTestDate(date: Date | string | null): void {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    if (date === null) {
      this.manualTestDate = null;
    } else {
      this.manualTestDate = new Date(date);
    }
  }

  /**
   * Get the current date and time.
   * If req is provided and in non-production, honors the 'x-test-date' header.
   */
  public now(req?: Request): Date {
    if (process.env.NODE_ENV !== 'production') {
      if (req && req.headers && req.headers['x-test-date']) {
        const headerVal = req.headers['x-test-date'];
        const testDateStr = Array.isArray(headerVal) ? headerVal[0] : headerVal;
        const parsed = new Date(testDateStr);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
      if (this.manualTestDate) {
        return new Date(this.manualTestDate.getTime());
      }
    }
    return new Date();
  }
}

export const clock = new ClockService();

