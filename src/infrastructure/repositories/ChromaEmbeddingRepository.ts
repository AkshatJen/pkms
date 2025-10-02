/**
 * ChromaEmbeddingRepository - ChromaDB implementation of IEmbeddingRepository
 */

import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import {
  IEmbeddingRepository,
  SearchResult,
} from '../../domain/repositories/IEmbeddingRepository';
import { EmbeddingDocument } from '../../domain/value-objects/EmbeddingDocument';

export class ChromaEmbeddingRepository implements IEmbeddingRepository {
  private embeddings: OpenAIEmbeddings;

  constructor(
    private collectionName: string,
    private chromaUrl: string,
    openAIApiKey: string
  ) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey,
    });
  }

  async createEmbeddings(documents: EmbeddingDocument[]): Promise<void> {
    if (documents.length === 0) {
      return;
    }

    // Convert to LangChain documents
    const langChainDocs = documents.map((doc) => doc.toLangChainDocument());

    // Clear existing collection
    await this.clear();

    // Create new collection with documents
    await Chroma.fromDocuments(langChainDocs, this.embeddings, {
      collectionName: this.collectionName,
      url: this.chromaUrl,
      collectionMetadata: { source: 'markdown-files' },
    });
  }

  async addDocuments(documents: EmbeddingDocument[]): Promise<void> {
    if (documents.length === 0) {
      return;
    }

    const vectorStore = await Chroma.fromExistingCollection(this.embeddings, {
      collectionName: this.collectionName,
      url: this.chromaUrl,
    });

    const langChainDocs = documents.map((doc) => doc.toLangChainDocument());
    await vectorStore.addDocuments(langChainDocs);
  }

  async similaritySearch(
    query: string,
    limit: number
  ): Promise<SearchResult[]> {
    const vectorStore = await Chroma.fromExistingCollection(this.embeddings, {
      collectionName: this.collectionName,
      url: this.chromaUrl,
    });

    const results = await vectorStore.similaritySearchWithScore(query, limit);

    return results.map(([doc, score]) => ({
      document: EmbeddingDocument.fromLangChainDocument(doc),
      score,
    }));
  }

  async clear(): Promise<void> {
    try {
      await fetch(
        `${this.chromaUrl}/api/v2/collections/${this.collectionName}`,
        {
          method: 'DELETE',
        }
      );
    } catch (error) {
      // Collection might not exist, which is fine
    }
  }

  async exists(): Promise<boolean> {
    try {
      // Try to connect to existing collection using LangChain
      // This is more reliable than direct HTTP API calls
      await Chroma.fromExistingCollection(this.embeddings, {
        collectionName: this.collectionName,
        url: this.chromaUrl,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.chromaUrl}/api/v2/heartbeat`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
