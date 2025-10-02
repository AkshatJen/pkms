/**
 * WorkLog Entity - Core domain entity representing a work log entry
 */

export class WorkLog {
  constructor(
    public readonly id: string,
    public readonly date: Date,
    public readonly content: string,
    public readonly filePath: string,
    public readonly metadata: WorkLogMetadata = {}
  ) {
    this.validateContent();
    this.validateDate();
  }

  private validateContent(): void {
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('WorkLog content cannot be empty');
    }
  }

  private validateDate(): void {
    if (!this.date || isNaN(this.date.getTime())) {
      throw new Error('WorkLog must have a valid date');
    }
  }

  /**
   * Extract date from filename (YYYY-MM-DD format)
   */
  static extractDateFromFilename(filename: string): Date | null {
    const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      return new Date(dateMatch[1]);
    }
    return null;
  }

  /**
   * Check if this work log falls within a date range
   */
  isWithinDateRange(startDate: Date, endDate: Date): boolean {
    return this.date >= startDate && this.date <= endDate;
  }

  /**
   * Get formatted date string for display
   */
  getFormattedDate(): string {
    return this.date.toISOString().split('T')[0];
  }

  /**
   * Get relative file path for display
   */
  getRelativeFilePath(): string {
    return this.filePath;
  }
}

export interface WorkLogMetadata {
  [key: string]: any;
}
