/**
 * LangChainDocumentSplitter - LangChain implementation of IDocumentSplitter
 */

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { IDocumentSplitter } from '../../application/services/EmbeddingService';
import { EmbeddingDocument } from '../../domain/value-objects/EmbeddingDocument';

export class LangChainDocumentSplitter implements IDocumentSplitter {
  async splitDocument(
    content: string,
    source: string,
    options: { chunkSize?: number; chunkOverlap?: number } = {}
  ): Promise<EmbeddingDocument[]> {
    const { chunkSize = 800, chunkOverlap = 100 } = options;

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ['\n## ', '\n### ', '\n\n', '\n', ' ']
    });

    const chunks = await splitter.createDocuments([content], [{ source }]);
    
    return chunks.map((chunk, index) => 
      new EmbeddingDocument(
        chunk.pageContent,
        source,
        index,
        chunk.metadata
      )
    );
  }
}
