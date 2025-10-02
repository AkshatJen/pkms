/**
 * DateRange Value Object - Represents a date range for temporal queries
 */

export class DateRange {
  constructor(
    public readonly startDate: Date,
    public readonly endDate: Date
  ) {
    this.validateRange();
  }

  private validateRange(): void {
    if (this.startDate > this.endDate) {
      throw new Error('Start date cannot be after end date');
    }
  }

  /**
   * Check if a date falls within this range
   */
  contains(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate;
  }

  /**
   * Create a DateRange for "last week"
   */
  static lastWeek(): DateRange {
    const now = new Date();
    const endDate = new Date(now);
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
    return new DateRange(startDate, endDate);
  }

  /**
   * Create a DateRange for "this week"
   */
  static thisWeek(): DateRange {
    const now = new Date();
    const startDate = new Date(now);
    const dayOfWeek = now.getDay();
    startDate.setDate(now.getDate() - dayOfWeek);
    return new DateRange(startDate, now);
  }

  /**
   * Create a DateRange for "last month"
   */
  static lastMonth(): DateRange {
    const now = new Date();
    const endDate = new Date(now);
    const startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 1);
    return new DateRange(startDate, endDate);
  }

  /**
   * Create a DateRange for "today"
   */
  static today(): DateRange {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    return new DateRange(startDate, endDate);
  }

  /**
   * Create a DateRange for "yesterday"
   */
  static yesterday(): DateRange {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);
    return new DateRange(startDate, endDate);
  }

  /**
   * Create a DateRange for "recent" (last 5 days)
   */
  static recent(): DateRange {
    const now = new Date();
    const endDate = new Date(now);
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 5);
    return new DateRange(startDate, endDate);
  }

  /**
   * Create a DateRange for specific month periods (early, mid, late)
   */
  static monthPeriod(period: 'early' | 'mid' | 'late', monthName: string): DateRange {
    const monthIndex = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ].indexOf(monthName.toLowerCase());

    if (monthIndex === -1) {
      throw new Error(`Invalid month name: ${monthName}`);
    }

    const year = new Date().getFullYear();
    let startDate: Date, endDate: Date;

    if (period === 'early') {
      startDate = new Date(year, monthIndex, 1);
      endDate = new Date(year, monthIndex, 10);
    } else if (period === 'mid') {
      startDate = new Date(year, monthIndex, 11);
      endDate = new Date(year, monthIndex, 20);
    } else {
      // late
      startDate = new Date(year, monthIndex, 21);
      endDate = new Date(year, monthIndex + 1, 0); // Last day of month
    }

    return new DateRange(startDate, endDate);
  }
}
