/**
 * EmbeddingRequest DTO - Data Transfer Object for embedding operations
 */

export interface EmbeddingRequest {
  forceRebuild?: boolean;
  batchSize?: number;
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface EmbeddingResponse {
  success: boolean;
  documentsProcessed: number;
  filesProcessed: number;
  message: string;
  errors?: string[];
}

export interface EmbeddingStatus {
  isAvailable: boolean;
  collectionExists: boolean;
  lastUpdate?: Date;
  documentCount?: number;
}
