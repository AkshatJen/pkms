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
  const results = await vectorStore.similaritySearch(query, 5);
  const context = results.map((doc) => doc.pageContent).join('\n\n---\n\n');

  // Prompt template for chat generation
  const prompt = PromptTemplate.fromTemplate(`
You are an intelligent assistant helping the user understand their work logs.

Use the following context to answer the question.

Context:
{context}

Question:
{question}

Answer in a clear and helpful way.
`);

  const model = new OpenAI({
    temperature: 0.3,
    openAIApiKey: process.env.OPENAI_API_KEY,
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
