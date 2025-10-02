/**
 * Container - Dependency injection container
 */

import dotenv from 'dotenv';
import path from 'path';
import { ChatService } from '../../application/services/ChatService';
import { EmbeddingService } from '../../application/services/EmbeddingService';
import { FileSystemWorkLogRepository } from '../repositories/FileSystemWorkLogRepository';
import { ChromaEmbeddingRepository } from '../repositories/ChromaEmbeddingRepository';
import { OpenAIService } from '../services/OpenAIService';
import { LangChainDocumentSplitter } from '../services/LangChainDocumentSplitter';

// Load environment variables
dotenv.config();

export class Container {
  private static instance: Container;
  private _chatService?: ChatService;
  private _embeddingService?: EmbeddingService;

  // Configuration
  private readonly DATA_DIR = path.join(process.cwd(), 'data');
  private readonly COLLECTION_NAME = 'work-logs';
  private readonly CHROMA_URL = 'http://localhost:8000';
  private readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  private constructor() {
    this.validateConfiguration();
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  private validateConfiguration(): void {
    if (!this.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
  }

  getChatService(): ChatService {
    if (!this._chatService) {
      const workLogRepository = new FileSystemWorkLogRepository(this.DATA_DIR);
      const embeddingRepository = new ChromaEmbeddingRepository(
        this.COLLECTION_NAME,
        this.CHROMA_URL,
        this.OPENAI_API_KEY!
      );
      const aiService = new OpenAIService(this.OPENAI_API_KEY!);

      this._chatService = new ChatService(
        workLogRepository,
        embeddingRepository,
        aiService
      );
    }
    return this._chatService;
  }

  getEmbeddingService(): EmbeddingService {
    if (!this._embeddingService) {
      const workLogRepository = new FileSystemWorkLogRepository(this.DATA_DIR);
      const embeddingRepository = new ChromaEmbeddingRepository(
        this.COLLECTION_NAME,
        this.CHROMA_URL,
        this.OPENAI_API_KEY!
      );
      const documentSplitter = new LangChainDocumentSplitter();

      this._embeddingService = new EmbeddingService(
        workLogRepository,
        embeddingRepository,
        documentSplitter
      );
    }
    return this._embeddingService;
  }

  // Getters for configuration
  get dataDirectory(): string {
    return this.DATA_DIR;
  }

  get collectionName(): string {
    return this.COLLECTION_NAME;
  }

  get chromaUrl(): string {
    return this.CHROMA_URL;
  }
}
