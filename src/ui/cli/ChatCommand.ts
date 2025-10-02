/**
 * ChatCommand - CLI command for interactive chat
 */

import readline from 'readline';
import { ChatService } from '../../application/services/ChatService';
import { ChatRequest } from '../../application/dtos/ChatRequest';

export class ChatCommand {
  constructor(private chatService: ChatService) {}

  async execute(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('💬 PKMS Chat Interface');
    console.log('Ask me anything about your work logs (type "exit" to quit):\n');

    const askQuestion = () => {
      rl.question('> ', async (input) => {
        if (input.toLowerCase() === 'exit') {
          console.log('Goodbye! 👋');
          rl.close();
          return;
        }

        if (!input.trim()) {
          askQuestion();
          return;
        }

        try {
          console.log('🤔 Thinking...\n');
          
          const request: ChatRequest = {
            query: input.trim(),
            maxResults: 10,
            includeContext: true
          };

          const response = await this.chatService.processQuery(request);
          
          console.log(`🧠 Answer:\n${response.answer}\n`);
          
          if (response.sources.length > 0) {
            console.log(`📚 Sources: ${response.sources.join(', ')}`);
          }
          
          console.log(`📊 Found ${response.documentsFound} relevant documents`);
          console.log(`🕒 Query type: ${response.isTemporalQuery ? 'Temporal' : 'Content-based'}\n`);
          
        } catch (error) {
          console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
          console.log('');
        }

        askQuestion();
      });
    };

    askQuestion();
  }
}
