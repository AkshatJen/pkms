/**
 * ChatService - Application service for handling chat queries
 */

import { ChatRequest, ChatResponse } from '../dtos/ChatRequest';
import { IWorkLogRepository } from '../../domain/repositories/IWorkLogRepository';
import { IEmbeddingRepository } from '../../domain/repositories/IEmbeddingRepository';
import { TemporalQueryParser } from '../../domain/services/TemporalQueryParser';
import { EmbeddingDocument } from '../../domain/value-objects/EmbeddingDocument';

export class ChatService {
  constructor(
    private workLogRepository: IWorkLogRepository,
    private embeddingRepository: IEmbeddingRepository,
    private aiService: IAIService
  ) {}

  async processQuery(request: ChatRequest): Promise<ChatResponse> {
    const { query, maxResults = 10 } = request;

    // Check if embedding service is available
    const isAvailable = await this.embeddingRepository.isAvailable();
    if (!isAvailable) {
      throw new Error('Embedding service is not available. Please ensure ChromaDB is running.');
    }

    // Check if embeddings exist
    const embeddingsExist = await this.embeddingRepository.exists();
    if (!embeddingsExist) {
      throw new Error('No embeddings found. Please run the embedding process first.');
    }

    // Parse temporal query
    const dateRange = TemporalQueryParser.parseQuery(query);
    const isTemporalQuery = dateRange !== null;

    let relevantDocuments: EmbeddingDocument[] = [];

    if (isTemporalQuery && dateRange) {
      // For temporal queries, get all documents and filter by date
      const searchResults = await this.embeddingRepository.similaritySearch(
        'work tasks projects', // Broad search to get all work-related content
        100 // Get many results to ensure we capture all date-relevant docs
      );

      // Filter by date and sort chronologically
      relevantDocuments = searchResults
        .map(result => result.document)
        .filter(doc => doc.isFromDateRange(dateRange.startDate, dateRange.endDate))
        .sort((a, b) => {
          const dateA = a.extractDateFromSource();
          const dateB = b.extractDateFromSource();
          if (dateA && dateB) {
            return dateB.getTime() - dateA.getTime(); // Most recent first
          }
          return 0;
        });
    } else {
      // For non-temporal queries, use semantic search
      const searchResults = await this.embeddingRepository.similaritySearch(query, 20);
      
      // Filter by relevance score
      relevantDocuments = searchResults
        .filter(result => result.score < 0.5) // Only include relevant results
        .map(result => result.document);
    }

    // Limit results to prevent token overflow
    relevantDocuments = relevantDocuments.slice(0, maxResults);

    if (relevantDocuments.length === 0) {
      return {
        answer: "I don't have enough data from the logs for that time period.",
        sources: [],
        isTemporalQuery,
        documentsFound: 0
      };
    }

    // Generate AI response
    const context = relevantDocuments
      .map(doc => doc.getDisplayString())
      .join('\n\n---\n\n');

    const answer = await this.aiService.generateResponse(query, context, isTemporalQuery);
    const sources = relevantDocuments.map(doc => doc.source);

    return {
      answer,
      sources: [...new Set(sources)], // Remove duplicates
      isTemporalQuery,
      documentsFound: relevantDocuments.length
    };
  }
}

export interface IAIService {
  generateResponse(query: string, context: string, isTemporalQuery: boolean): Promise<string>;
}
