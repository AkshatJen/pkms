#!/usr/bin/env npx ts-node

/**
 * Test Embeddings Script for PKMS
 * 
 * This script tests the embedding system by running sample queries
 * and showing the results. Useful for debugging and verification.
 * 
 * Usage:
 *   npx ts-node scripts/test-embeddings.ts
 */

import dotenv from 'dotenv';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';

dotenv.config();

const COLLECTION_NAME = 'work-logs';
const CHROMA_URL = 'http://localhost:8000';

async function testEmbeddings() {
  console.log('🧪 Testing PKMS Embedding System...\n');

  try {
    // Check ChromaDB connection
    const response = await fetch(`${CHROMA_URL}/api/v1/heartbeat`);
    if (!response.ok) {
      throw new Error('ChromaDB not responding');
    }
    console.log('✅ ChromaDB is running');

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const vectorStore = await Chroma.fromExistingCollection(embeddings, {
      collectionName: COLLECTION_NAME,
      url: CHROMA_URL,
    });

    console.log('✅ Connected to vector store\n');

    // Test queries
    const testQueries = [
      'Amazon Connect',
      'TDD meetings',
      'recent work',
      'Jira documentation',
      'late August work'
    ];

    for (const query of testQueries) {
      console.log(`🔍 Testing query: "${query}"`);
      const results = await vectorStore.similaritySearchWithScore(query, 3);
      
      if (results.length === 0) {
        console.log('   No results found\n');
        continue;
      }

      results.forEach(([doc, score], index) => {
        console.log(`   ${index + 1}. Score: ${score.toFixed(3)} | Source: ${doc.metadata.source}`);
        console.log(`      Content: ${doc.pageContent.substring(0, 80)}...`);
      });
      console.log('');
    }

    console.log('✅ Embedding system test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error && error.message.includes('ChromaDB')) {
      console.log('\n💡 Make sure ChromaDB is running:');
      console.log('   chroma run --host localhost --port 8000');
    }
    
    if (error instanceof Error && error.message.includes('Collection')) {
      console.log('\n💡 Make sure embeddings are created:');
      console.log('   npx ts-node scripts/simple-embed.ts');
    }
  }
}

testEmbeddings().catch(console.error);
