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
      modelName: 'gpt-3.5-turbo-instruct',
    });
  }

  async generateResponse(
    query: string,
    context: string,
    isTemporalQuery: boolean
  ): Promise<string> {
    const currentDate = new Date().toISOString().split('T')[0];

    const promptTemplate = PromptTemplate.fromTemplate(`
      You are a professional assistant reviewing detailed work logs. Today's date is ${currentDate}.

      Use the context below to generate a comprehensive, well-organized summary. Be as specific as possible about dates, tasks, and activities.
      Each entry is prefixed with [YYYY-MM-DD] to show the date.

      ${
        isTemporalQuery
          ? `For temporal queries, create a detailed summary organized by themes/categories such as:
        - 🤖 Technical Work (LLM, AI, development projects)
        - 🏢 Team Collaboration & Meetings
        - 📊 Project Management & Planning
        - 🎯 Learning & Development
        - 🏖️ Time Off & Personal
        - ☁️ Infrastructure & Tools
        - 💼 Administrative Tasks

        Within each category, mention specific dates, tasks, and outcomes. Include details about:
        - What was accomplished
        - Who was involved (meetings, collaborations)
        - Any tools, technologies, or platforms used
        - Outcomes and next steps
        - Any challenges or blockers encountered

        Organize the response chronologically within each category when possible.`
          : 'Focus on the content and provide relevant information based on semantic similarity.'
      }

      NEVER say "I don't have enough data from the logs for that time period" unless the context is completely empty.
      If there is ANY relevant information in the context, provide a detailed summary of what was found.

      Context:
      {context}

      Question:
      {question}

      Detailed Answer:
    `);

    const chain = promptTemplate
      .pipe(this.model)
      .pipe(new StringOutputParser());

    return await chain.invoke({
      context,
      question: query,
    });
  }
}
