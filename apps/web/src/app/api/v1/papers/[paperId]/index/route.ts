/**
 * API route: /api/v1/papers/:paperId/index
 * Index a paper in the RAG system (chunk + embed + store in Weaviate)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TextChunker } from '@research-os/ingestion'
import { WeaviateVectorStore, EmbeddingService, RAGPipeline } from '@research-os/rag'

// Force dynamic rendering - this route uses authentication headers
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { paperId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paperId } = params

    // Get paper from database
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
    })

    if (!paper) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 })
    }

    // Check if already indexed
    const existingChunks = await prisma.chunk.findMany({
      where: { paperId },
    })

    if (existingChunks.length > 0) {
      return NextResponse.json({
        message: 'Paper already indexed',
        chunkCount: existingChunks.length,
      })
    }

    // Initialize RAG components
    const vectorStore = new WeaviateVectorStore({
      url: process.env.WEAVIATE_URL!,
      apiKey: process.env.WEAVIATE_API_KEY,
    })

    // Ensure schema is initialized before indexing
    try {
      await vectorStore.initializeSchema()
    } catch (error) {
      console.error('⚠️ Schema initialization warning (may already exist):', error)
      // Continue - schema might already exist
    }

    const embeddingService = new EmbeddingService({
      apiKey: process.env.OPENAI_API_KEY!,
    })

    const ragPipeline = new RAGPipeline({
      vectorStore,
      embeddingService,
    })

    // Chunk the paper
    const chunker = new TextChunker({
      chunkSize: 512,
      chunkOverlap: 50,
    })

    const content = `${paper.title}\n\n${paper.abstract}`
    const rawChunks = chunker.chunk(content, paper.id)

    console.log(`Created ${rawChunks.length} chunks for paper ${paper.id}`)

    // Add paper metadata to chunks
    const chunksWithMetadata = rawChunks.map((chunk) => ({
      ...chunk,
      metadata: {
        paper_id: paper.id,
        paper_title: paper.title,
        paper_year: paper.year,
        paper_venue: paper.venue,
        paper_arxiv_id: paper.arxivId,
      },
    }))

    // Save chunks to database
    await prisma.chunk.createMany({
      data: chunksWithMetadata.map((chunk) => ({
        paperId: paper.id,
        content: chunk.content,
        chunkIndex: chunk.chunk_index,
        section: chunk.section || 'abstract',
        metadata: chunk.metadata as any,
      })),
    })

    // Index in Weaviate with metadata
    await ragPipeline.indexChunks(chunksWithMetadata)

    console.log(`Indexed ${chunksWithMetadata.length} chunks in Weaviate`)

    // Get the searchId from request body (if provided)
    const body = await request.json().catch(() => ({}))
    const searchId = body.searchId

    // Auto-create or update chat session if searchId is provided
    if (searchId) {
      try {
        // Check if chat session exists
        const existingSession = await prisma.chatSession.findUnique({
          where: { searchId },
        })

        if (existingSession) {
          // Update existing session with new paper
          const updatedPaperIds = Array.from(new Set([...existingSession.paperIds, paper.id]))
          await prisma.chatSession.update({
            where: { id: existingSession.id },
            data: {
              paperIds: updatedPaperIds,
              paperCount: updatedPaperIds.length,
            },
          })
          console.log(`Updated chat session ${existingSession.id} with paper ${paper.id}`)
        } else {
          // Create new chat session
          const search = await prisma.search.findUnique({
            where: { id: searchId },
          })

          if (search) {
            await prisma.chatSession.create({
              data: {
                searchId,
                title: `Chat: ${search.query}`,
                description: `Ask questions about papers from your search`,
                paperIds: [paper.id],
                paperCount: 1,
              },
            })
            console.log(`Created chat session for search ${searchId}`)
          }
        }
      } catch (error) {
        console.error('Error creating/updating chat session:', error)
        // Don't fail the indexing if chat session creation fails
      }
    }

    return NextResponse.json({
      message: 'Paper indexed successfully',
      paperId: paper.id,
      chunkCount: chunksWithMetadata.length,
    })
  } catch (error) {
    console.error('Indexing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
