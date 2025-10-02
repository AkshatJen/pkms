/**
 * TestCommand - CLI command for testing embeddings
 */

import { ChatService } from '../../application/services/ChatService';
import { EmbeddingService } from '../../application/services/EmbeddingService';
import { ChatRequest } from '../../application/dtos/ChatRequest';

export class TestCommand {
  constructor(
    private chatService: ChatService,
    private embeddingService: EmbeddingService
  ) {}

  async execute(): Promise<void> {
    console.log('🧪 Testing PKMS Embedding System...\n');

    try {
      // Check system status
      const status = await this.embeddingService.getStatus();
      
      if (!status.isAvailable) {
        console.error('❌ ChromaDB is not available');
        console.log('💡 Make sure ChromaDB is running:');
        console.log('   chroma run --host localhost --port 8000');
        return;
      }

      if (!status.collectionExists) {
        console.error('❌ Embeddings collection does not exist');
        console.log('💡 Make sure embeddings are created:');
        console.log('   npm run embed');
        return;
      }

      console.log('✅ ChromaDB is running');
      console.log('✅ Embeddings collection exists\n');

      // Test queries
      const testQueries = [
        'Amazon Connect',
        'TDD meetings',
        'recent work',
        'Jira documentation',
        'late August work',
        'last week summary'
      ];

      for (const query of testQueries) {
        console.log(`🔍 Testing query: "${query}"`);
        
        try {
          const request: ChatRequest = {
            query,
            maxResults: 3
          };

          const response = await this.chatService.processQuery(request);
          
          console.log(`   📊 Found ${response.documentsFound} documents`);
          console.log(`   🕒 Query type: ${response.isTemporalQuery ? 'Temporal' : 'Content-based'}`);
          
          if (response.sources.length > 0) {
            console.log(`   📚 Sources: ${response.sources.slice(0, 2).join(', ')}${response.sources.length > 2 ? '...' : ''}`);
          }
          
          if (response.answer.length > 100) {
            console.log(`   💬 Answer preview: ${response.answer.substring(0, 100)}...`);
          } else {
            console.log(`   💬 Answer: ${response.answer}`);
          }
          
        } catch (error) {
          console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        console.log('');
      }

      console.log('✅ Embedding system test completed!');

    } catch (error) {
      console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}
