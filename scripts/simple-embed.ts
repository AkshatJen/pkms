#!/usr/bin/env npx ts-node

/**
 * Reliable Embedding Script for PKMS
 *
 * This script processes all markdown files in the data directory and creates
 * embeddings for semantic search. It's designed to be simple and reliable.
 *
 * Usage:
 *   npx ts-node scripts/simple-embed.ts
 *   npx ts-node scripts/simple-embed.ts --force  # Force rebuild
 */

import fs from 'fs';
import path from 'path';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import dotenv from 'dotenv';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { Document } from 'langchain/document';

dotenv.config();

const DATA_DIR = path.join(__dirname, '..', 'data');
const COLLECTION_NAME = 'work-logs';
const CHROMA_URL = 'http://localhost:8000';

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

async function simpleEmbed() {
  console.log('🚀 Starting simple embedding process...');

  // Check if ChromaDB is running
  try {
    const response = await fetch(`${CHROMA_URL}/api/v2/heartbeat`);
    if (!response.ok) {
      throw new Error('ChromaDB not responding');
    }
  } catch (error) {
    console.error(
      '❌ ChromaDB is not running. Please start it with: chroma run --host localhost --port 8000',
      error instanceof Error ? error.message : 'Unknown error'
    );
    process.exit(1);
  }

  const files = getMarkdownFilesRecursively(DATA_DIR);
  console.log(`🔍 Found ${files.length} markdown files`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800, // Smaller chunks to avoid issues
    chunkOverlap: 100,
    separators: ['\n## ', '\n### ', '\n\n', '\n', ' '],
  });

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const docs: Document[] = [];

  // Process files in smaller batches
  const batchSize = 20;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    console.log(
      `📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        files.length / batchSize
      )}`
    );

    for (const file of batch) {
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
  }

  console.log(`📊 Total documents to embed: ${docs.length}`);

  try {
    // Clear existing collection by trying to delete it
    try {
      await fetch(`${CHROMA_URL}/api/v2/collections/${COLLECTION_NAME}`, {
        method: 'DELETE',
      });
      console.log('🗑️ Cleared existing collection');
    } catch {
      console.log('ℹ️ No existing collection to clear');
    }

    // Create new collection with all documents
    await Chroma.fromDocuments(docs, embeddings, {
      collectionName: COLLECTION_NAME,
      url: CHROMA_URL,
      collectionMetadata: { source: 'markdown-files' },
    });

    console.log('✅ All documents embedded and stored in Chroma.');
  } catch (error) {
    console.error('❌ Error embedding documents:', error);
    process.exit(1);
  }
}

simpleEmbed().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
