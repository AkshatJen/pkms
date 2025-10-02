#!/usr/bin/env npx ts-node

/**
 * Chat CLI Entry Point
 * 
 * Main entry point for the PKMS chat interface using DDD architecture
 */

import { Container } from '../infrastructure/config/Container';
import { ChatCommand } from '../ui/cli/ChatCommand';

async function main() {
  try {
    const container = Container.getInstance();
    const chatService = container.getChatService();
    const chatCommand = new ChatCommand(chatService);

    await chatCommand.execute();
  } catch (error) {
    console.error('❌ Failed to start chat interface:', error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
      console.log('\n💡 Make sure to set your OpenAI API key in .env file:');
      console.log('   OPENAI_API_KEY=your_api_key_here');
    }
    
    process.exit(1);
  }
}

main().catch(console.error);
