/**
 * OpenAIService - OpenAI implementation of IAIService
 */

import { OpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { IAIService } from '../../application/services/ChatService';

export class OpenAIService implements IAIService {
  private model: OpenAI;

  constructor(openAIApiKey: string) {
    this.model = new OpenAI({
      temperature: 0.3,
      openAIApiKey,
      maxTokens: 1000,
      modelName: 'gpt-3.5-turbo-instruct'
    });
  }

  async generateResponse(query: string, context: string, isTemporalQuery: boolean): Promise<string> {
    const currentDate = new Date().toISOString().split('T')[0];
    
    const promptTemplate = PromptTemplate.fromTemplate(`
      You are a professional assistant reviewing detailed work logs. Today's date is ${currentDate}.

      Use the context below to generate a full, rich, and organized summary. Be as specific as possible about dates and tasks.
      Each entry is prefixed with [YYYY-MM-DD] to show the date.

      ${isTemporalQuery 
        ? 'When answering temporal queries like "last week" or "this week", focus on the relevant date range and organize the response chronologically.'
        : 'Focus on the content and provide relevant information based on semantic similarity.'
      }

      ONLY say "I don't have enough data from the logs for that time period" if the context is completely empty or contains no relevant information.

      Context:
      {context}

      Question:
      {question}

      Detailed Answer:
    `);

    const chain = promptTemplate.pipe(this.model).pipe(new StringOutputParser());

    return await chain.invoke({
      context,
      question: query
    });
  }
}
