import fs from 'fs';
import path from 'path';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import dotenv from 'dotenv';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { Document } from 'langchain/document';

dotenv.config();

const DATA_DIR = path.join(__dirname, '..', 'data');
const CHROMA_DIR = path.join(__dirname, '..', 'chroma');
const COLLECTION_NAME = 'work-logs';

function getMarkdownFilesRecursively(folderPath: string): string[] {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  let files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);

    if (entry.isDirectory()) {
      files = files.concat(getMarkdownFilesRecursively(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function run() {
  const files = getMarkdownFilesRecursively(DATA_DIR);
  console.log(`🔍 Found ${files.length} markdown files`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const docs: Document[] = [];

  for (const file of files) {
    const rawContent = fs.readFileSync(file, 'utf-8');
    const fileName = path.relative(DATA_DIR, file);

    const chunks = await splitter.createDocuments(
      [rawContent],
      [{ source: fileName }]
    );

    chunks.forEach((chunk, index) => {
      chunk.metadata.source = fileName;
      chunk.metadata.chunk = index;
    });

    docs.push(...chunks);

    console.log(`✅ Processed ${fileName} (${chunks.length} chunks)`);
  }

  const vectorStore = await Chroma.fromDocuments(docs, embeddings, {
    collectionName: COLLECTION_NAME,
    url: 'http://localhost:8000', // remove basePath
    collectionMetadata: { source: 'markdown-files' },
  });

  console.log('✅ All documents embedded and stored in Chroma.');
}

run().catch((err) => {
  console.error('❌ Error embedding documents:', err);
});
