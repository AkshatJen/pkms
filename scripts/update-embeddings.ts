#!/usr/bin/env npx ts-node

/**
 * Incremental Embedding Update Script for PKMS
 *
 * This script only processes files that have been modified since the last update.
 * For a complete rebuild, use the simple-embed.ts script instead.
 *
 * Usage:
 *   npx ts-node scripts/update-embeddings.ts        # Update only modified files
 *   npx ts-node scripts/update-embeddings.ts --force # Force complete rebuild
 */

import fs from 'fs';
import path from 'path';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import dotenv from 'dotenv';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { Document } from 'langchain/document';

dotenv.config();

const DATA_DIR = path.join(__dirname, '../data');
const COLLECTION_NAME = 'work-logs';
const CHROMA_URL = 'http://localhost:8000';

// Track when embeddings were last updated
const LAST_UPDATE_FILE = path.join(__dirname, '.last-embedding-update');

function getLastUpdateTime(): Date {
  try {
    const timestamp = fs.readFileSync(LAST_UPDATE_FILE, 'utf-8');
    return new Date(timestamp);
  } catch {
    return new Date(0); // If file doesn't exist, return epoch
  }
}

function setLastUpdateTime(): void {
  fs.writeFileSync(LAST_UPDATE_FILE, new Date().toISOString());
}

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

function getModifiedFiles(lastUpdate: Date): string[] {
  const allFiles = getMarkdownFilesRecursively(DATA_DIR);
  return allFiles.filter((file) => {
    const stats = fs.statSync(file);
    return stats.mtime > lastUpdate;
  });
}

async function updateEmbeddings(force: boolean = false) {
  if (force) {
    console.log(
      '🔄 Force rebuild requested. Use simple-embed.ts for better reliability.'
    );
    console.log('Run: npx ts-node scripts/simple-embed.ts');
    return;
  }

  const lastUpdate = getLastUpdateTime();
  const modifiedFiles = getModifiedFiles(lastUpdate);

  if (modifiedFiles.length === 0) {
    console.log(
      '✅ No new or modified files found. Embeddings are up to date.'
    );
    return;
  }

  console.log(`🔄 Found ${modifiedFiles.length} modified files to process`);

  // For simplicity, if there are many modified files, recommend full rebuild
  if (modifiedFiles.length > 10) {
    console.log('⚠️ Many files modified. Recommend full rebuild with:');
    console.log('npx ts-node scripts/simple-embed.ts');
    return;
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 100,
    separators: ['\n## ', '\n### ', '\n\n', '\n', ' '],
  });

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const docs: Document[] = [];

  for (const file of modifiedFiles) {
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

  try {
    const vectorStore = await Chroma.fromExistingCollection(embeddings, {
      collectionName: COLLECTION_NAME,
      url: CHROMA_URL,
    });

    await vectorStore.addDocuments(docs);
    setLastUpdateTime();
    console.log('✅ Embeddings updated successfully.');
  } catch (error) {
    console.log(
      '⚠️ Error with incremental update. Recommend full rebuild with:'
    );
    console.log('npx ts-node scripts/simple-embed.ts');
    console.error(
      'Error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// CLI interface
const args = process.argv.slice(2);
const force = args.includes('--force') || args.includes('-f');

updateEmbeddings(force).catch((err) => {
  console.error('❌ Error updating embeddings:', err);
  process.exit(1);
});
