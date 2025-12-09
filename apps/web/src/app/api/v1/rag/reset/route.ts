/**
 * API route: /api/v1/rag/reset
 * Reset RAG system (delete and recreate schema)
 */

import { NextResponse } from 'next/server'
import weaviate from 'weaviate-ts-client'

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

    // Parse URL
    const url = new URL(weaviateUrl)
    
    // Initialize client
    const clientConfig = {
      scheme: url.protocol.replace(':', '') as 'http' | 'https',
      host: url.host,
      ...(weaviateApiKey && { apiKey: new weaviate.ApiKey(weaviateApiKey) }),
    }

    const client = weaviate.client(clientConfig as any)

    // Delete existing schema if exists
    try {
      await client.schema.classDeleter().withClassName('PaperChunk').do()
    } catch (error) {
      // Class might not exist, that's okay
    }

    return NextResponse.json({
      message: 'Schema deleted successfully. Run /api/v1/rag/init to recreate.',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to reset RAG system',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
