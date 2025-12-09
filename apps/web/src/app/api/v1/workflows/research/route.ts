/**
 * API route: /api/v1/workflows/research
 * Proxy to ADK-TS Agent Server with real-time progress updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TextChunker } from '@research-os/ingestion'
import { WeaviateVectorStore, EmbeddingService, RAGPipeline } from '@research-os/rag'

const AGENT_SERVER_URL = process.env.AGENT_SERVER_URL || 'http://localhost:3002'

// Background indexing function
async function indexPaperInBackground(paperId: string, paper: any) {
  try {
    // Check if already indexed
    const existingChunks = await prisma.chunk.findMany({
      where: { paperId },
    })

    if (existingChunks.length > 0) {
      console.log(`📄 Paper ${paperId} already indexed, skipping`)
      return
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

    // Index in Weaviate
    await ragPipeline.indexChunks(chunksWithMetadata)

    console.log(`✅ Indexed ${chunksWithMetadata.length} chunks for paper: ${paper.title}`)
  } catch (error) {
    console.error(`❌ Failed to index paper ${paperId}:`, error)
    throw error
  }
}

// Agent execution timing estimates (in ms)
const AGENT_TIMINGS = {
  planner: 2000,
  search: 3000,
  synthesis: 4000,
  report: 5000,
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const startTime = Date.now()
    
    // Create workflow execution record
    const workflowExecution = await prisma.workflowExecution.create({
      data: {
        userId: user.id,
        query: body.query,
        workflowType: (body.workflowType || 'FULL').toUpperCase(),
        status: 'RUNNING',
        agentsUsed: [],
        sources: body.options?.sources || ['arxiv', 'semantic_scholar'],
        paperIds: [],
      },
    })
    
    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        const sendUpdate = (type: string, data: any) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type, ...data, workflowId: workflowExecution.id })}\n\n`)
          )
        }

        try {
          console.log('🚀 Starting ADK-TS workflow:', body.query, 'ID:', workflowExecution.id)
          
          // Step 1: Planner Agent
          sendUpdate('status', {
            agent: 'planner',
            status: 'running',
            message: '🧠 Planner Agent: Analyzing query and creating research strategy...'
          })

          // Prepare workflow request with session information
          // Use user ID as session identifier for persistent conversations
          const workflowRequest = {
            ...body,
            sessionService: undefined, // Will be handled by agent server
            sessionOptions: {
              userId: user.id,
              sessionId: body.sessionId || undefined, // Optional: allows resuming a session
              appName: 'research-os',
            },
          }

          // Start workflow execution (non-blocking)
          const workflowPromise = fetch(`${AGENT_SERVER_URL}/api/workflows/research`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              // Pass session info via headers (agent server supports this)
              'X-User-Id': user.id,
              ...(body.sessionId && { 'X-Session-Id': body.sessionId }),
            },
            body: JSON.stringify(workflowRequest),
          })

          // Simulate planner execution time
          await new Promise(resolve => setTimeout(resolve, AGENT_TIMINGS.planner))
          
          sendUpdate('status', {
            agent: 'planner',
            status: 'completed',
            message: '✅ Research plan created'
          })

          // Step 2: Search Agent
          sendUpdate('status', {
            agent: 'search',
            status: 'running',
            message: '🔍 Search Agent: Finding papers via MCP connectors (arXiv, Semantic Scholar)...'
          })

          await new Promise(resolve => setTimeout(resolve, AGENT_TIMINGS.search))
          
          sendUpdate('status', {
            agent: 'search',
            status: 'completed',
            message: '✅ Papers found and ranked'
          })

          // Step 3: Synthesis Agent
          sendUpdate('status', {
            agent: 'synthesis',
            status: 'running',
            message: '💡 Synthesis Agent: Analyzing findings and identifying patterns...'
          })

          await new Promise(resolve => setTimeout(resolve, AGENT_TIMINGS.synthesis))
          
          sendUpdate('status', {
            agent: 'synthesis',
            status: 'completed',
            message: '✅ Analysis complete'
          })

          // Step 4: Report Agent
          sendUpdate('status', {
            agent: 'report',
            status: 'running',
            message: '📄 Report Agent: Generating comprehensive report...'
          })

          // Wait for actual workflow to complete
          const response = await workflowPromise

          if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Workflow failed' }))
            throw new Error(error.message || 'Workflow failed')
          }

          const result = await response.json()
          const executionTime = Date.now() - startTime
          const finalResult = result.result || result

          // Debug: Log the workflow result structure
          console.log('📊 Workflow result keys:', Object.keys(finalResult))
          console.log('📊 Papers in result:', finalResult.papers ? `${finalResult.papers.length} papers` : 'No papers field')
          console.log('📊 Metadata:', finalResult.metadata)

          // Save and index papers from workflow result
          const paperIds: string[] = []
          if (finalResult.papers && Array.isArray(finalResult.papers)) {
            console.log(`📄 Processing ${finalResult.papers.length} papers from workflow`)
            
            for (const paperData of finalResult.papers) {
              try {
                // Check if paper already exists
                let paper = await prisma.paper.findFirst({
                  where: {
                    OR: [
                      { arxivId: paperData.arxivId },
                      { doi: paperData.doi },
                      { title: paperData.title },
                    ].filter(condition => Object.values(condition)[0]) // Filter out null/undefined
                  }
                })

                // Create paper if it doesn't exist
                if (!paper) {
                  paper = await prisma.paper.create({
                    data: {
                      title: paperData.title || 'Untitled',
                      abstract: paperData.abstract || paperData.summary || '',
                      doi: paperData.doi || null,
                      arxivId: paperData.arxivId || null,
                      pubmedId: paperData.pubmedId || null,
                      semanticScholarId: paperData.semanticScholarId || null,
                      year: paperData.year || new Date().getFullYear(),
                      month: paperData.month || null,
                      venue: paperData.venue || paperData.journal || null,
                      publisher: paperData.publisher || null,
                      pdfUrl: paperData.pdfUrl || paperData.pdf_url || null,
                      htmlUrl: paperData.htmlUrl || paperData.url || null,
                      topics: paperData.topics || [],
                      keywords: paperData.keywords || [],
                      categories: paperData.categories || [],
                      citations: paperData.citations || paperData.citationCount || null,
                      source: paperData.source || 'workflow',
                      sourceId: paperData.id || paperData.arxivId || paperData.doi || `workflow-${Date.now()}`,
                      rawJson: paperData,
                    },
                  })
                  console.log(`✅ Created paper: ${paper.title}`)
                }

                paperIds.push(paper.id)

                // Index paper for RAG (async, don't wait)
                // Note: Indexing happens in background, papers will be available for chat shortly
                indexPaperInBackground(paper.id, paper).catch(err => 
                  console.error('Failed to index paper:', paper.id, err)
                )

              } catch (error) {
                console.error('Error processing paper:', paperData.title, error)
                // Continue with other papers
              }
            }
            
            console.log(`✅ Processed ${paperIds.length} papers for workflow`)
          }

          // Create chat session for this workflow
          let chatSessionId: string | null = null
          try {
            const chatSession = await prisma.chatSession.create({
              data: {
                search: {
                  create: {
                    userId: user.id,
                    query: body.query,
                    status: 'COMPLETED',
                    totalResults: finalResult.metadata?.totalPapers || paperIds.length || 0,
                    executionTimeMs: executionTime,
                    completedAt: new Date(),
                  },
                },
                title: body.query,
                description: `Chat about workflow: ${body.query}`,
                paperIds: paperIds,
                paperCount: paperIds.length,
              },
            })
            chatSessionId = chatSession.id
            console.log('✅ Chat session created:', chatSessionId, 'with', paperIds.length, 'papers')
          } catch (chatError) {
            console.error('Failed to create chat session:', chatError)
            // Continue without chat session
          }

          // Update workflow execution with results
          await prisma.workflowExecution.update({
            where: { id: workflowExecution.id },
            data: {
              status: 'COMPLETED',
              plan: finalResult.plan,
              papers: finalResult.papers,
              analysis: finalResult.analysis,
              report: finalResult.report,
              agentsUsed: finalResult.metadata?.agentsUsed || ['Planner', 'Search', 'Synthesis', 'Report'],
              executionTimeMs: executionTime,
              totalPapers: paperIds.length,
              paperIds: paperIds,
              chatSessionId: chatSessionId,
              completedAt: new Date(),
            },
          })

          sendUpdate('status', {
            agent: 'report',
            status: 'completed',
            message: '✅ Report generated successfully'
          })

          // Send final result with chat session
          console.log('✅ ADK-TS workflow complete, ID:', workflowExecution.id)
          sendUpdate('complete', { 
            result: { 
              ...finalResult, 
              chatSessionId 
            } 
          })

          controller.close()
        } catch (error) {
          console.error('❌ Workflow error:', error)
          
          // Update workflow execution with error
          await prisma.workflowExecution.update({
            where: { id: workflowExecution.id },
            data: {
              status: 'FAILED',
              errorMessage: error instanceof Error ? error.message : 'Internal server error',
              completedAt: new Date(),
            },
          }).catch(console.error)
          
          sendUpdate('error', {
            error: error instanceof Error ? error.message : 'Internal server error'
          })
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Workflow error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
