/**
 * API route: /api/v1/rag/ask
 * Ask questions using RAG (Retrieval-Augmented Generation)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RAGPipeline } from '@research-os/rag'
import { generateWithFallback } from '@/lib/llm-fallback'

// Force dynamic rendering - this route uses authentication headers
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { question } = await request.json()

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    console.log('🤔 RAG Question:', question)

    // Initialize RAG pipeline components
    const { WeaviateVectorStore, EmbeddingService, RAGPipeline } = await import('@research-os/rag')
    
    const vectorStore = new WeaviateVectorStore({
      url: process.env.WEAVIATE_URL!,
      apiKey: process.env.WEAVIATE_API_KEY!,
    })

    const embeddingService = new EmbeddingService({
      apiKey: process.env.OPENAI_API_KEY!,
    })

    const ragPipeline = new RAGPipeline({
      vectorStore,
      embeddingService,
    })

    // Retrieve relevant chunks
    console.log('🔍 Searching for relevant content...')
    const retrievalContext = await ragPipeline.retrieve(question, {
      limit: 5,
      minScore: 0.5, // Lowered threshold to get more results
    })
    
    console.log('📊 Search results:', {
      totalFound: retrievalContext.chunks.length,
      scores: retrievalContext.chunks.map(c => c.score),
    })

    if (retrievalContext.chunks.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find any relevant information in the indexed papers. Please make sure you've indexed some papers first by going to the search page and clicking 'Index with RAG' on papers.",
        sources: [],
      })
    }

    console.log(`✅ Found ${retrievalContext.chunks.length} relevant chunks`)

    // Build context from retrieved chunks
    const context = retrievalContext.chunks
      .map((chunk: any, index: number) => {
        const title = chunk.metadata?.paper_title || 'Unknown Paper'
        return `[Source ${index + 1}] ${title}\n${chunk.content}\n`
      })
      .join('\n---\n\n')

    // Generate answer using LLM with fallback to Gemini
    console.log('🤖 Generating answer...')
    const { content: answer, model, usedFallback } = await generateWithFallback(
      [
        {
          role: 'system',
          content: `You're a friendly, approachable research assistant who loves helping people understand complex research in simple, engaging ways. Think of yourself as that smart friend who gets excited about discoveries and explains things in a way that actually makes sense.

**Your personality:**
- Warm, conversational, and genuinely helpful
- Use natural, everyday language - talk like you're chatting with a friend
- Break down complex concepts into digestible, relatable explanations
- Show enthusiasm about interesting findings
- Be honest when you don't have enough information

**Guidelines:**
- Use ONLY the information from the provided context
- Cite sources naturally by mentioning paper titles (e.g., "According to [Paper Title], they found that...")
- If the context doesn't have enough info, be friendly about it: "I don't have enough details in the papers I've seen to fully answer that, but here's what I can tell you..."
- Be comprehensive but keep it conversational - no need for overly academic language
- Use analogies and examples when they help clarify things
- End with an invitation for follow-up questions

**Remember:** You're having a conversation, not writing a research paper. Make it engaging and easy to understand!`,
        },
        {
          role: 'user',
          content: `Context from research papers:\n\n${context}\n\n---\n\nQuestion: ${question}\n\nPlease provide a detailed answer based on the context above.`,
        },
      ],
      {
        temperature: 0.8,
        max_tokens: 1500,
      }
    )

    if (usedFallback) {
      console.log('⚠️  Used Gemini fallback due to OpenAI rate limit')
    }

    console.log('✅ Answer generated')

    // Format sources
    const sources = retrievalContext.chunks.map((chunk: any) => ({
      paperId: chunk.paperId || chunk.metadata?.paper_id || 'unknown',
      title: chunk.metadata?.paper_title || 'Unknown Paper',
      content: chunk.content.substring(0, 200) + '...',
      score: chunk.score,
    }))

    return NextResponse.json({
      answer,
      sources,
      metadata: {
        chunksRetrieved: retrievalContext.chunks.length,
        model,
        usedFallback,
      },
    })
  } catch (error) {
    console.error('RAG ask error:', error)
    
    // Check if it's a Weaviate connection error
    const errorMessage = error instanceof Error ? error.message : 'Failed to process question'
    const isWeaviateError = errorMessage.includes('fetch failed') || 
                           errorMessage.includes('timeout') || 
                           errorMessage.includes('ECONNREFUSED')
    
    if (isWeaviateError) {
      return NextResponse.json(
        {
          error: 'Unable to connect to Weaviate vector database. Please check:\n\n1. Weaviate Cloud instance is running\n2. Network connectivity\n3. API credentials are correct\n\nTry again in a few moments.',
          details: errorMessage,
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
