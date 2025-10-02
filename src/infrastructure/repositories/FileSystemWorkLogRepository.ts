/**
 * FileSystemWorkLogRepository - File system implementation of IWorkLogRepository
 */

import fs from 'fs';
import path from 'path';
import { IWorkLogRepository } from '../../domain/repositories/IWorkLogRepository';
import { WorkLog } from '../../domain/entities/WorkLog';
import { DateRange } from '../../domain/value-objects/DateRange';

export class FileSystemWorkLogRepository implements IWorkLogRepository {
  constructor(private dataDirectory: string) {}

  async getAll(): Promise<WorkLog[]> {
    const files = this.getMarkdownFilesRecursively(this.dataDirectory);
    const workLogs: WorkLog[] = [];

    for (const file of files) {
      const workLog = await this.createWorkLogFromFile(file);
      if (workLog) {
        workLogs.push(workLog);
      }
    }

    return workLogs;
  }

  async getByDateRange(dateRange: DateRange): Promise<WorkLog[]> {
    const allLogs = await this.getAll();
    return allLogs.filter(log => log.isWithinDateRange(dateRange.startDate, dateRange.endDate));
  }

  async getByFilePaths(filePaths: string[]): Promise<WorkLog[]> {
    const workLogs: WorkLog[] = [];

    for (const filePath of filePaths) {
      const fullPath = path.join(this.dataDirectory, filePath);
      if (fs.existsSync(fullPath)) {
        const workLog = await this.createWorkLogFromFile(fullPath);
        if (workLog) {
          workLogs.push(workLog);
        }
      }
    }

    return workLogs;
  }

  async getModifiedAfter(date: Date): Promise<WorkLog[]> {
    const files = this.getMarkdownFilesRecursively(this.dataDirectory);
    const modifiedFiles = files.filter(file => {
      const stats = fs.statSync(file);
      return stats.mtime > date;
    });

    const workLogs: WorkLog[] = [];
    for (const file of modifiedFiles) {
      const workLog = await this.createWorkLogFromFile(file);
      if (workLog) {
        workLogs.push(workLog);
      }
    }

    return workLogs;
  }

  async exists(): Promise<boolean> {
    if (!fs.existsSync(this.dataDirectory)) {
      return false;
    }

    const files = this.getMarkdownFilesRecursively(this.dataDirectory);
    return files.length > 0;
  }

  private getMarkdownFilesRecursively(folderPath: string): string[] {
    if (!fs.existsSync(folderPath)) {
      return [];
    }

    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    let files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry.name);

      if (entry.isDirectory()) {
        files = files.concat(this.getMarkdownFilesRecursively(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private async createWorkLogFromFile(filePath: string): Promise<WorkLog | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(this.dataDirectory, filePath);
      const date = WorkLog.extractDateFromFilename(relativePath);

      if (!date) {
        console.warn(`Could not extract date from filename: ${relativePath}`);
        return null;
      }

      const id = this.generateId(relativePath);
      return new WorkLog(id, date, content, relativePath);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }

  private generateId(filePath: string): string {
    // Simple ID generation based on file path
    return Buffer.from(filePath).toString('base64');
  }
}
