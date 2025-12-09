/**
 * Debug endpoint to check Weaviate status
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { WeaviateVectorStore, EmbeddingService } = await import('@research-os/rag')
    
    const vectorStore = new WeaviateVectorStore({
      url: process.env.WEAVIATE_URL!,
      apiKey: process.env.WEAVIATE_API_KEY!,
    })

    // Check health
    const isHealthy = await vectorStore.healthCheck()
    
    // Get count
    const count = await vectorStore.getCount()

    // Try a simple search
    const embeddingService = new EmbeddingService({
      apiKey: process.env.OPENAI_API_KEY!,
    })
    
    const [testEmbedding] = await embeddingService.embed(['test query'])
    
    const testResults = await vectorStore.search({
      query: 'test',
      queryVector: testEmbedding,
      limit: 5,
      minScore: 0.0, // Get any results
    })

    return NextResponse.json({
      weaviate: {
        healthy: isHealthy,
        totalChunks: count,
        url: process.env.WEAVIATE_URL,
      },
      testSearch: {
        resultsFound: testResults.length,
        results: testResults.map(r => ({
          paperId: r.paperId,
          score: r.score,
          contentPreview: r.content.substring(0, 100),
        })),
      },
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Debug failed',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
