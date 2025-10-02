#!/usr/bin/env npx ts-node

/**
 * Update Embeddings CLI Entry Point
 * 
 * Entry point for incremental embedding updates using DDD architecture
 */

import path from 'path';
import { Container } from '../infrastructure/config/Container';
import { EmbeddingCommand } from '../ui/cli/EmbeddingCommand';

async function main() {
  try {
    const args = process.argv.slice(2);
    const force = args.includes('--force') || args.includes('-f');

    if (force) {
      console.log('🔄 Force rebuild requested. Use embed command for better reliability.');
      console.log('Run: npm run embed');
      return;
    }

    const container = Container.getInstance();
    const embeddingService = container.getEmbeddingService();
    const embeddingCommand = new EmbeddingCommand(embeddingService);

    const lastUpdateFile = path.join(__dirname, '../../scripts/.last-embedding-update');
    await embeddingCommand.updateEmbeddings(lastUpdateFile);
  } catch (error) {
    console.error('❌ Failed to update embeddings:', error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
      console.log('\n💡 Make sure to set your OpenAI API key in .env file:');
      console.log('   OPENAI_API_KEY=your_api_key_here');
    }
    
    if (error instanceof Error && error.message.includes('ChromaDB')) {
      console.log('\n💡 Make sure ChromaDB is running:');
      console.log('   chroma run --host localhost --port 8000');
    }
    
    process.exit(1);
  }
}

main().catch(console.error);
