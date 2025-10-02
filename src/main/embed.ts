#!/usr/bin/env npx ts-node

/**
 * Embedding CLI Entry Point
 * 
 * Main entry point for creating embeddings using DDD architecture
 */

import { Container } from '../infrastructure/config/Container';
import { EmbeddingCommand } from '../ui/cli/EmbeddingCommand';

async function main() {
  try {
    const args = process.argv.slice(2);
    const force = args.includes('--force') || args.includes('-f');
    const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '20');

    const container = Container.getInstance();
    const embeddingService = container.getEmbeddingService();
    const embeddingCommand = new EmbeddingCommand(embeddingService);

    await embeddingCommand.createEmbeddings({ force, batchSize });
  } catch (error) {
    console.error('❌ Failed to create embeddings:', error instanceof Error ? error.message : 'Unknown error');
    
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
