/**
 * IWorkLogRepository - Repository interface for WorkLog persistence
 */

import { WorkLog } from '../entities/WorkLog';
import { DateRange } from '../value-objects/DateRange';

export interface IWorkLogRepository {
  /**
   * Get all work logs
   */
  getAll(): Promise<WorkLog[]>;

  /**
   * Get work logs within a date range
   */
  getByDateRange(dateRange: DateRange): Promise<WorkLog[]>;

  /**
   * Get work logs by file paths
   */
  getByFilePaths(filePaths: string[]): Promise<WorkLog[]>;

  /**
   * Get work logs modified after a specific date
   */
  getModifiedAfter(date: Date): Promise<WorkLog[]>;

  /**
   * Check if work logs exist
   */
  exists(): Promise<boolean>;
}
