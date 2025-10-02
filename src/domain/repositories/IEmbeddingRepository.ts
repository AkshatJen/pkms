/**
 * IEmbeddingRepository - Repository interface for embedding operations
 */

import { EmbeddingDocument } from '../value-objects/EmbeddingDocument';

export interface SearchResult {
  document: EmbeddingDocument;
  score: number;
}

export interface IEmbeddingRepository {
  /**
   * Create embeddings for documents
   */
  createEmbeddings(documents: EmbeddingDocument[]): Promise<void>;

  /**
   * Add documents to existing collection
   */
  addDocuments(documents: EmbeddingDocument[]): Promise<void>;

  /**
   * Search for similar documents
   */
  similaritySearch(query: string, limit: number): Promise<SearchResult[]>;

  /**
   * Clear all embeddings
   */
  clear(): Promise<void>;

  /**
   * Check if embeddings collection exists
   */
  exists(): Promise<boolean>;

  /**
   * Check if the embedding service is available
   */
  isAvailable(): Promise<boolean>;
}
