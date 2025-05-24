import dotenv from 'dotenv';
import readline from 'readline';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

dotenv.config();

const COLLECTION_NAME = 'work-logs';
const CHROMA_URL = 'http://localhost:8000'; // Local Chroma instance

async function getAnswer(query: string) {
  // Initialize embeddings and vector store
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const vectorStore = await Chroma.fromExistingCollection(embeddings, {
    collectionName: COLLECTION_NAME,
    url: CHROMA_URL,
  });

  // Search for relevant documents
  const resultsWithScores = await vectorStore.similaritySearchWithScore(
    query,
    15
  ); // query is string

  const filtered = resultsWithScores
    .filter(([doc, score]) => score < 0.5)
    .map(([doc]) => doc); // Extract only documents

  const context = filtered.map((doc) => doc.pageContent).join('\n\n---\n\n');

  // Prompt template for chat generation
  const prompt = PromptTemplate.fromTemplate(`
    You are a professional assistant reviewing detailed work logs.
    
    Use the context below to generate a full, rich, and organized summary in paragraph form. Be as specific as possible. If tasks are listed, group and explain them clearly.
    
    If the answer isn't available, say "I don't have enough data from the logs."
    
    Context:
    {context}
    
    Question:
    {question}
    
    Detailed Answer:
    `);

  const model = new OpenAI({
    temperature: 0.3,
    openAIApiKey: process.env.OPENAI_API_KEY,
    maxTokens: 2048, // Give it room to generate
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
