/**
 * EmbeddingDocument Value Object - Represents a document chunk for embedding
 */

export class EmbeddingDocument {
  constructor(
    public readonly content: string,
    public readonly source: string,
    public readonly chunkIndex: number,
    public readonly metadata: DocumentMetadata = {}
  ) {
    this.validateContent();
    this.validateSource();
  }

  private validateContent(): void {
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('EmbeddingDocument content cannot be empty');
    }
  }

  private validateSource(): void {
    if (!this.source || this.source.trim().length === 0) {
      throw new Error('EmbeddingDocument must have a valid source');
    }
  }

  /**
   * Create a formatted display string for this document
   */
  getDisplayString(): string {
    const date = this.extractDateFromSource();
    const dateStr = date ? date.toISOString().split('T')[0] : 'Unknown date';
    return `[${dateStr}] ${this.content}`;
  }

  /**
   * Extract date from the source filename
   */
  extractDateFromSource(): Date | null {
    const dateMatch = this.source.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      return new Date(dateMatch[1]);
    }
    return null;
  }

  /**
   * Check if this document is from a specific date range
   */
  isFromDateRange(startDate: Date, endDate: Date): boolean {
    const docDate = this.extractDateFromSource();
    if (!docDate) return false;
    return docDate >= startDate && docDate <= endDate;
  }

  /**
   * Create a LangChain Document-compatible object
   */
  toLangChainDocument(): any {
    return {
      pageContent: this.content,
      metadata: {
        source: this.source,
        chunk: this.chunkIndex,
        ...this.metadata
      }
    };
  }

  /**
   * Create from LangChain Document
   */
  static fromLangChainDocument(doc: any): EmbeddingDocument {
    return new EmbeddingDocument(
      doc.pageContent,
      doc.metadata.source,
      doc.metadata.chunk || 0,
      doc.metadata
    );
  }
}

export interface DocumentMetadata {
  [key: string]: any;
}
