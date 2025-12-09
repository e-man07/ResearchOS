/**
 * API route: /api/v1/rag/init
 * Initialize RAG system (Weaviate schema)
 */

import { NextResponse } from 'next/server'
import { WeaviateVectorStore } from '@research-os/rag'

export async function POST() {
  try {
    const weaviateUrl = process.env.WEAVIATE_URL
    const weaviateApiKey = process.env.WEAVIATE_API_KEY

    if (!weaviateUrl) {
      return NextResponse.json(
        { error: 'WEAVIATE_URL not configured' },
        { status: 500 }
      )
    }

    // Initialize vector store
    const vectorStore = new WeaviateVectorStore({
      url: weaviateUrl,
      apiKey: weaviateApiKey,
    })

    // Check health
    const healthy = await vectorStore.healthCheck()
    if (!healthy) {
      return NextResponse.json(
        { error: 'Weaviate health check failed' },
        { status: 500 }
      )
    }

    // Initialize schema
    await vectorStore.initializeSchema()

    // Get stats
    const count = await vectorStore.getCount()

    return NextResponse.json({
      message: 'RAG system initialized successfully',
      weaviate: {
        url: weaviateUrl,
        healthy: true,
        totalChunks: count,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to initialize RAG system',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
