/**
 * TemporalQueryParser Domain Service - Parses temporal queries and returns date ranges
 */

import { DateRange } from '../value-objects/DateRange';

export class TemporalQueryParser {
  /**
   * Parse a query string and return a DateRange if it contains temporal information
   */
  static parseQuery(query: string): DateRange | null {
    const queryLower = query.toLowerCase();

    // Last week / past week
    if (queryLower.includes('last week') || queryLower.includes('past week')) {
      return DateRange.lastWeek();
    }

    // This week
    if (queryLower.includes('this week')) {
      return DateRange.thisWeek();
    }

    // Last month / past month
    if (
      queryLower.includes('last month') ||
      queryLower.includes('past month')
    ) {
      return DateRange.lastMonth();
    }

    // Today
    if (queryLower.includes('today')) {
      return DateRange.today();
    }

    // Yesterday
    if (queryLower.includes('yesterday')) {
      return DateRange.yesterday();
    }

    // Recent, lately, last few days - but only if it's clearly temporal
    if (
      queryLower.includes('recently') ||
      queryLower.includes('lately') ||
      queryLower.includes('last few days') ||
      queryLower.includes('recent days') ||
      queryLower.includes('recent weeks') ||
      (queryLower.includes('recent') &&
        (queryLower.includes('what') ||
          queryLower.includes('show') ||
          queryLower.includes('tell') ||
          queryLower.includes('summary') ||
          queryLower.includes('update')))
    ) {
      return DateRange.recent();
    }

    // Handle "late August", "early September", etc.
    const monthPeriodMatch = queryLower.match(
      /\b(late|early|mid)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/
    );
    if (monthPeriodMatch) {
      const [, period, monthName] = monthPeriodMatch;
      return DateRange.monthPeriod(
        period as 'early' | 'mid' | 'late',
        monthName
      );
    }

    // Handle full month queries like "August", "in August", "what did I do in August"
    const fullMonthMatch = queryLower.match(
      /\b(?:in\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\b/
    );
    if (fullMonthMatch) {
      const [, monthName] = fullMonthMatch;
      return DateRange.fullMonth(monthName);
    }

    return null;
  }

  /**
   * Check if a query contains temporal keywords
   */
  static isTemporalQuery(query: string): boolean {
    return this.parseQuery(query) !== null;
  }
}
