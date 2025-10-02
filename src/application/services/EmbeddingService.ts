/**
 * EmbeddingService - Application service for managing embeddings
 */

import { EmbeddingRequest, EmbeddingResponse, EmbeddingStatus } from '../dtos/EmbeddingRequest';
import { IWorkLogRepository } from '../../domain/repositories/IWorkLogRepository';
import { IEmbeddingRepository } from '../../domain/repositories/IEmbeddingRepository';
import { EmbeddingDocument } from '../../domain/value-objects/EmbeddingDocument';

export class EmbeddingService {
  constructor(
    private workLogRepository: IWorkLogRepository,
    private embeddingRepository: IEmbeddingRepository,
    private documentSplitter: IDocumentSplitter
  ) {}

  async createEmbeddings(request: EmbeddingRequest = {}): Promise<EmbeddingResponse> {
    const {
      forceRebuild = false,
      batchSize = 20,
      chunkSize = 800,
      chunkOverlap = 100
    } = request;

    try {
      // Check if embedding service is available
      const isAvailable = await this.embeddingRepository.isAvailable();
      if (!isAvailable) {
        throw new Error('Embedding service is not available. Please ensure ChromaDB is running.');
      }

      // Get all work logs
      const workLogs = await this.workLogRepository.getAll();
      if (workLogs.length === 0) {
        return {
          success: false,
          documentsProcessed: 0,
          filesProcessed: 0,
          message: 'No work logs found to process'
        };
      }

      // Clear existing embeddings if force rebuild
      if (forceRebuild) {
        await this.embeddingRepository.clear();
      }

      // Split documents into chunks
      const allDocuments: EmbeddingDocument[] = [];
      let filesProcessed = 0;

      // Process files in batches
      for (let i = 0; i < workLogs.length; i += batchSize) {
        const batch = workLogs.slice(i, i + batchSize);
        
        for (const workLog of batch) {
          const chunks = await this.documentSplitter.splitDocument(
            workLog.content,
            workLog.getRelativeFilePath(),
            { chunkSize, chunkOverlap }
          );

          allDocuments.push(...chunks);
          filesProcessed++;
        }
      }

      // Create embeddings
      await this.embeddingRepository.createEmbeddings(allDocuments);

      return {
        success: true,
        documentsProcessed: allDocuments.length,
        filesProcessed,
        message: `Successfully processed ${filesProcessed} files and created ${allDocuments.length} document chunks`
      };

    } catch (error) {
      return {
        success: false,
        documentsProcessed: 0,
        filesProcessed: 0,
        message: 'Failed to create embeddings',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async updateEmbeddings(lastUpdateDate: Date): Promise<EmbeddingResponse> {
    try {
      // Get modified work logs
      const modifiedLogs = await this.workLogRepository.getModifiedAfter(lastUpdateDate);
      
      if (modifiedLogs.length === 0) {
        return {
          success: true,
          documentsProcessed: 0,
          filesProcessed: 0,
          message: 'No new or modified files found. Embeddings are up to date.'
        };
      }

      // For many modified files, recommend full rebuild
      if (modifiedLogs.length > 10) {
        return {
          success: false,
          documentsProcessed: 0,
          filesProcessed: 0,
          message: 'Many files modified. Recommend full rebuild for better reliability.',
          errors: ['Use forceRebuild option for complete rebuild']
        };
      }

      // Split modified documents into chunks
      const documents: EmbeddingDocument[] = [];
      for (const workLog of modifiedLogs) {
        const chunks = await this.documentSplitter.splitDocument(
          workLog.content,
          workLog.getRelativeFilePath()
        );
        documents.push(...chunks);
      }

      // Add to existing collection
      await this.embeddingRepository.addDocuments(documents);

      return {
        success: true,
        documentsProcessed: documents.length,
        filesProcessed: modifiedLogs.length,
        message: `Successfully updated embeddings for ${modifiedLogs.length} modified files`
      };

    } catch (error) {
      return {
        success: false,
        documentsProcessed: 0,
        filesProcessed: 0,
        message: 'Failed to update embeddings',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async getStatus(): Promise<EmbeddingStatus> {
    const isAvailable = await this.embeddingRepository.isAvailable();
    const collectionExists = await this.embeddingRepository.exists();

    return {
      isAvailable,
      collectionExists
    };
  }
}

export interface IDocumentSplitter {
  splitDocument(
    content: string, 
    source: string, 
    options?: { chunkSize?: number; chunkOverlap?: number }
  ): Promise<EmbeddingDocument[]>;
}
