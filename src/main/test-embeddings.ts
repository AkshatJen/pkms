#!/usr/bin/env npx ts-node

/**
 * Test Embeddings CLI Entry Point
 * 
 * Entry point for testing embeddings using DDD architecture
 */

import { Container } from '../infrastructure/config/Container';
import { TestCommand } from '../ui/cli/TestCommand';

async function main() {
  try {
    const container = Container.getInstance();
    const chatService = container.getChatService();
    const embeddingService = container.getEmbeddingService();
    const testCommand = new TestCommand(chatService, embeddingService);

    await testCommand.execute();
  } catch (error) {
    console.error('❌ Failed to run tests:', error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
      console.log('\n💡 Make sure to set your OpenAI API key in .env file:');
      console.log('   OPENAI_API_KEY=your_api_key_here');
    }
    
    process.exit(1);
  }
}

main().catch(console.error);
