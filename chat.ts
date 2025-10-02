import dotenv from 'dotenv';
import readline from 'readline';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

dotenv.config();

const COLLECTION_NAME = 'work-logs';
const CHROMA_URL = 'http://localhost:8000'; // Local Chroma instance

// Helper function to parse date from filename
function extractDateFromFilename(filename: string): Date | null {
  const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    return new Date(dateMatch[1]);
  }
  return null;
}

// Helper function to get date range for temporal queries
function getDateRangeForQuery(query: string): {
  startDate: Date | null;
  endDate: Date | null;
} {
  const now = new Date();
  const queryLower = query.toLowerCase();

  if (queryLower.includes('last week') || queryLower.includes('past week')) {
    const endDate = new Date(now);
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
    return { startDate, endDate };
  }

  if (queryLower.includes('this week')) {
    const startDate = new Date(now);
    const dayOfWeek = now.getDay();
    startDate.setDate(now.getDate() - dayOfWeek);
    return { startDate, endDate: now };
  }

  if (queryLower.includes('last month') || queryLower.includes('past month')) {
    const endDate = new Date(now);
    const startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 1);
    return { startDate, endDate };
  }

  if (queryLower.includes('today')) {
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }

  if (queryLower.includes('yesterday')) {
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }

  // Handle "recent", "lately", "last few days"
  if (
    queryLower.includes('recent') ||
    queryLower.includes('lately') ||
    queryLower.includes('last few days')
  ) {
    const endDate = new Date(now);
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 5);
    return { startDate, endDate };
  }

  // Handle "late August", "early September", etc.
  const monthPeriodMatch = queryLower.match(
    /\b(late|early|mid)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/
  );
  if (monthPeriodMatch) {
    const [, period, monthName] = monthPeriodMatch;
    const monthIndex = [
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december',
    ].indexOf(monthName);

    const year = now.getFullYear();
    let startDate: Date, endDate: Date;

    if (period === 'early') {
      startDate = new Date(year, monthIndex, 1);
      endDate = new Date(year, monthIndex, 10);
    } else if (period === 'mid') {
      startDate = new Date(year, monthIndex, 11);
      endDate = new Date(year, monthIndex, 20);
    } else {
      // late
      startDate = new Date(year, monthIndex, 21);
      endDate = new Date(year, monthIndex + 1, 0); // Last day of month
    }

    return { startDate, endDate };
  }

  // Handle full month queries like "August", "in August", "what did I do in August"
  const fullMonthMatch = queryLower.match(
    /\b(?:in\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\b/
  );
  if (fullMonthMatch) {
    const [, monthName] = fullMonthMatch;
    const monthIndex = [
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december',
    ].indexOf(monthName);

    const year = now.getFullYear();
    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0); // Last day of month

    return { startDate, endDate };
  }

  return { startDate: null, endDate: null };
}

async function getAnswer(query: string) {
  // Initialize embeddings and vector store
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const vectorStore = await Chroma.fromExistingCollection(embeddings, {
    collectionName: COLLECTION_NAME,
    url: CHROMA_URL,
  });

  // Get date range for temporal queries
  const { startDate, endDate } = getDateRangeForQuery(query);

  let filtered: any[] = [];

  if (startDate && endDate) {
    // For temporal queries, get ALL documents and filter by date first
    const allResults = await vectorStore.similaritySearchWithScore(
      'work tasks projects', // Broad search to get all work-related content
      100 // Get many results to ensure we capture all date-relevant docs
    );

    // Filter by date first
    const dateFiltered = allResults
      .map(([doc]) => doc)
      .filter((doc) => {
        const docDate = extractDateFromFilename(doc.metadata.source || '');
        if (docDate) {
          return docDate >= startDate && docDate <= endDate;
        }
        return false;
      });

    // Sort by date (most recent first)
    dateFiltered.sort((a, b) => {
      const dateA = extractDateFromFilename(a.metadata.source || '');
      const dateB = extractDateFromFilename(b.metadata.source || '');
      if (dateA && dateB) {
        return dateB.getTime() - dateA.getTime();
      }
      return 0;
    });

    filtered = dateFiltered;
  } else {
    // For non-temporal queries, use semantic search
    const resultsWithScores = await vectorStore.similaritySearchWithScore(
      query,
      20
    );

    filtered = resultsWithScores
      .filter(([, score]) => score < 0.5)
      .map(([doc]) => doc);
  }

  // Limit the number of documents to prevent token overflow
  // For temporal queries, allow more results for comprehensive summaries
  const resultLimit = startDate !== null && endDate !== null ? 20 : 10;
  filtered = filtered.slice(0, resultLimit);

  // Check if we have any relevant documents
  if (filtered.length === 0) {
    return "I don't have enough data from the logs for that time period.";
  }

  const context = filtered
    .map((doc) => {
      const docDate = extractDateFromFilename(doc.metadata.source || '');
      const dateStr = docDate
        ? docDate.toISOString().split('T')[0]
        : 'Unknown date';
      return `[${dateStr}] ${doc.pageContent}`;
    })
    .join('\n\n---\n\n');

  // Enhanced prompt template with date awareness
  const currentDate = new Date().toISOString().split('T')[0];
  const isTemporalQuery = startDate !== null && endDate !== null;

  const prompt = PromptTemplate.fromTemplate(`
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

  const model = new OpenAI({
    temperature: 0.3,
    openAIApiKey: process.env.OPENAI_API_KEY,
    maxTokens: 1000,
    modelName: 'gpt-3.5-turbo-instruct', // Better model with larger context
  });

  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  const answer = await chain.invoke({
    context,
    question: query,
  });

  return answer;
}

// CLI interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('💬 Ask me anything about your work logs: ', async (input) => {
  const answer = await getAnswer(input);
  console.log(`\n🧠 Answer:\n${answer}`);
  rl.close();
});
