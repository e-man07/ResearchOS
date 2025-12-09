/**
 * Clear all chunks from database and Weaviate
 */

import { PrismaClient } from '@prisma/client'
import weaviate from 'weaviate-ts-client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function clearChunks() {
  try {
    console.log('🗑️  Clearing chunks from database...')
    
    // Delete from PostgreSQL
    const result = await prisma.chunk.deleteMany({})
    console.log(`✅ Deleted ${result.count} chunks from database`)

    // Delete from Weaviate
    if (process.env.WEAVIATE_URL && process.env.WEAVIATE_API_KEY) {
      console.log('🗑️  Clearing chunks from Weaviate...')
      
      const client = weaviate.client({
        scheme: process.env.WEAVIATE_URL.startsWith('https') ? 'https' : 'http',
        host: process.env.WEAVIATE_URL.replace(/^https?:\/\//, ''),
        apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY),
      })

      try {
        // Delete the entire class
        await client.schema.classDeleter().withClassName('PaperChunk').do()
        console.log('✅ Deleted PaperChunk class from Weaviate')

        // Recreate the class
        await client.schema.classCreator().withClass({
          class: 'PaperChunk',
          description: 'Paper chunks for RAG',
          vectorizer: 'none',
          properties: [
            {
              name: 'content',
              dataType: ['text'],
              description: 'Chunk content',
            },
            {
              name: 'paperId',
              dataType: ['string'],
              description: 'Paper ID',
            },
            {
              name: 'chunkIndex',
              dataType: ['int'],
              description: 'Chunk index in paper',
            },
            {
              name: 'section',
              dataType: ['string'],
              description: 'Section name',
            },
            {
              name: 'metadata',
              dataType: ['text'],
              description: 'Additional metadata (JSON string)',
            },
          ],
        }).do()
        console.log('✅ Recreated PaperChunk class in Weaviate')
      } catch (error) {
        console.log('ℹ️  Weaviate class might not exist yet, skipping...')
      }
    }

    console.log('\n✅ All chunks cleared! You can now re-index papers.')
    console.log('👉 Go to http://localhost:3000/search and click "Index with RAG" on papers\n')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

clearChunks()
