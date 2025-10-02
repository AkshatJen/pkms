/**
 * EmbeddingCommand - CLI commands for embedding management
 */

import { EmbeddingService } from '../../application/services/EmbeddingService';
import { EmbeddingRequest } from '../../application/dtos/EmbeddingRequest';

export class EmbeddingCommand {
  constructor(private embeddingService: EmbeddingService) {}

  async createEmbeddings(options: { force?: boolean; batchSize?: number } = {}): Promise<void> {
    console.log('🚀 Starting embedding process...\n');

    const request: EmbeddingRequest = {
      forceRebuild: options.force || false,
      batchSize: options.batchSize || 20,
      chunkSize: 800,
      chunkOverlap: 100
    };

    try {
      const response = await this.embeddingService.createEmbeddings(request);

      if (response.success) {
        console.log('✅', response.message);
        console.log(`📊 Files processed: ${response.filesProcessed}`);
        console.log(`📄 Documents created: ${response.documentsProcessed}`);
      } else {
        console.error('❌', response.message);
        if (response.errors) {
          response.errors.forEach(error => console.error('  -', error));
        }
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async updateEmbeddings(lastUpdateFile: string): Promise<void> {
    console.log('🔄 Checking for updates...\n');

    try {
      const lastUpdate = this.getLastUpdateTime(lastUpdateFile);
      const response = await this.embeddingService.updateEmbeddings(lastUpdate);

      if (response.success) {
        console.log('✅', response.message);
        if (response.filesProcessed > 0) {
          console.log(`📊 Files processed: ${response.filesProcessed}`);
          console.log(`📄 Documents updated: ${response.documentsProcessed}`);
          this.setLastUpdateTime(lastUpdateFile);
        }
      } else {
        console.error('❌', response.message);
        if (response.errors) {
          response.errors.forEach(error => console.error('  -', error));
        }
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getStatus(): Promise<void> {
    console.log('🔍 Checking embedding status...\n');

    try {
      const status = await this.embeddingService.getStatus();

      console.log(`🌐 ChromaDB Available: ${status.isAvailable ? '✅' : '❌'}`);
      console.log(`📚 Collection Exists: ${status.collectionExists ? '✅' : '❌'}`);

      if (status.lastUpdate) {
        console.log(`🕒 Last Update: ${status.lastUpdate.toISOString()}`);
      }

      if (status.documentCount !== undefined) {
        console.log(`📄 Document Count: ${status.documentCount}`);
      }

      if (!status.isAvailable) {
        console.log('\n💡 To start ChromaDB:');
        console.log('   chroma run --host localhost --port 8000');
      }

      if (!status.collectionExists && status.isAvailable) {
        console.log('\n💡 To create embeddings:');
        console.log('   npm run embed');
      }

    } catch (error) {
      console.error('❌ Error checking status:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private getLastUpdateTime(filePath: string): Date {
    try {
      const fs = require('fs');
      const timestamp = fs.readFileSync(filePath, 'utf-8');
      return new Date(timestamp);
    } catch {
      return new Date(0); // If file doesn't exist, return epoch
    }
  }

  private setLastUpdateTime(filePath: string): void {
    try {
      const fs = require('fs');
      fs.writeFileSync(filePath, new Date().toISOString());
    } catch (error) {
      console.warn('Warning: Could not update last update time:', error);
    }
  }
}
