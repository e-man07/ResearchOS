import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RAGPipeline, WeaviateVectorStore, EmbeddingService } from '@research-os/rag'
import { generateWithFallback } from '@/lib/llm-fallback'

// Initialize RAG pipeline
const vectorStore = new WeaviateVectorStore({
  url: process.env.WEAVIATE_URL!,
  apiKey: process.env.WEAVIATE_API_KEY,
})

const embeddingService = new EmbeddingService({
  apiKey: process.env.OPENAI_API_KEY!,
})

const ragPipeline = new RAGPipeline({
  vectorStore,
  embeddingService,
})

// POST /api/v1/chat/:sessionId/messages
// Send message with conversation memory
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { message } = await request.json()
    const sessionId = params.sessionId

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'message string required' },
        { status: 400 }
      )
    }

    // Get chat session with recent messages (for memory)
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 20, // Last 20 messages for better context window
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      )
    }

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'USER',
        content: message,
        contextPapers: [], // User messages don't have context
      },
    })

    // Build conversation history for memory (oldest to newest)
    const conversationHistory = session.messages
      .reverse()
      .map((msg) => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
        content: msg.content,
      }))
    
    console.log(`💬 Conversation context: ${conversationHistory.length} previous messages loaded`)

    // Search for relevant paper chunks using RAG
    let searchResults: Array<{
      content: string
      paperId: string
      score: number
      metadata?: Record<string, unknown>
    }> = []
    let contextText = ''
    
    try {
      const ragContext = await ragPipeline.retrieve(message, {
        limit: 10,
        minScore: 0.5, // Lower threshold to catch more results
      })

      // Filter to only include papers from this session
      console.log('📊 RAG returned chunks:', ragContext.chunks.length)
      console.log('📊 Session paper IDs:', session.paperIds)
      console.log('📊 Chunk paper IDs:', ragContext.chunks.map(c => c.paperId))
      
      searchResults = ragContext.chunks.filter((chunk) =>
        session.paperIds.includes(chunk.paperId)
      )
      
      console.log('📊 Filtered chunks:', searchResults.length)
      
      // If no results with filtering, show what we would have gotten
      if (searchResults.length === 0 && ragContext.chunks.length > 0) {
        console.log('⚠️  No chunks matched session papers, but found chunks from other papers')
        console.log('⚠️  This might indicate a paper ID mismatch issue')
      }

      // Build context from relevant chunks
      if (searchResults.length > 0) {
        contextText = searchResults
          .map(
            (result, idx) =>
              `[Source ${idx + 1}] (Relevance: ${(result.score * 100).toFixed(1)}%)\n${result.content}`
          )
          .join('\n\n')
      }
    } catch (error) {
      console.error('RAG search error:', error)
      // Continue without RAG context if search fails
    }

    const systemPrompt = `You're a friendly, enthusiastic research assistant who genuinely loves helping people explore academic research! Think of yourself as that smart, approachable friend who gets excited about cool discoveries and loves sharing knowledge in a way that's actually fun.

**Your personality:**
- Warm, conversational, and genuinely curious (like chatting with a friend who happens to know a lot about research)
- Enthusiastic but never overwhelming or condescending
- Use natural, everyday language - contractions, casual phrases, the way people actually talk
- Break down complex stuff into simple, relatable explanations
- Use analogies, examples, and real-world connections to make things click
- Show real interest in what the user is asking about
- Encourage exploration and follow-up questions

**Context:**
You have access to ${session.paperCount} papers from: "${session.title.replace(/^Chat:\s*/i, '')}".

${conversationHistory.length > 0 ? `You're continuing a conversation with this user. You have ${conversationHistory.length} previous messages in context, so remember what you've already discussed and build on it naturally.` : `This is the start of a new conversation.`}

${contextText ? `Awesome! I found some really relevant stuff in the papers that'll help answer this. Let me share what I discovered!` : `I'll do my best to help based on what I know!`}

**How to respond:**
- Start with genuine warmth and interest (e.g., "Oh, that's a great question!", "I'm so glad you asked about this!", "This is really interesting!")
- Talk like you're explaining to a friend, not lecturing
- Use "you" and "I" - make it personal and conversational
- **IMPORTANT: Remember previous parts of the conversation** - reference things you've already discussed, build on previous answers, and maintain continuity
- When mentioning sources, weave them in naturally (e.g., "One of the papers I found [Source 1] shows that...", "There's something really cool in [Source 2] where they...")
- If you're not sure about something, be honest and friendly about it
- End with an open invitation for more questions (e.g., "Want to dive deeper into any of this?", "Anything else you're curious about?", "Feel free to ask more!")
- Use emojis sparingly but naturally - just enough to add warmth 😊
- Match the user's energy - if they're casual, be casual; if they're more formal, adapt accordingly

**Remember:** You're having a real conversation with someone who's curious. Make them feel excited about what they're learning, not intimidated by it! Use the conversation history to make your responses feel connected and natural.`

    // Generate response with LLM (with conversation memory + RAG context) and fallback to Gemini
    const { content: assistantResponse, model, usedFallback } = await generateWithFallback(
      [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...conversationHistory,
        {
          role: 'user',
          content: contextText
            ? `Context from papers:\n\n${contextText}\n\nQuestion: ${message}`
            : message,
        },
      ],
      {
        temperature: 0.9,
        max_tokens: 2000,
      }
    )

    if (usedFallback) {
      console.log('⚠️  Used Gemini fallback due to OpenAI rate limit')
    }

    // Save assistant message with RAG context
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: assistantResponse,
        contextPapers: searchResults.map((r) => r.paperId),
        relevanceScores: searchResults.map((r) => ({
          paperId: r.paperId,
          score: r.score,
        })),
        // Note: Token usage not available when using Gemini fallback
      },
    })

    // Update session metadata
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        totalMessages: { increment: 2 }, // User + Assistant
        lastMessageAt: new Date(),
      },
    })

    console.log(`💬 Chat message processed for session: ${sessionId} (${searchResults.length} sources)`)

    return NextResponse.json({
      userMessage,
      assistantMessage,
      sources: searchResults.map((r, idx) => ({
        index: idx + 1,
        paperId: r.paperId,
        score: r.score,
        content: r.content.substring(0, 200) + '...',
      })),
      usage: {
        model,
        usedFallback,
        // Note: Token usage not available when using Gemini fallback
      },
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET /api/v1/chat/:sessionId/messages
// Get conversation history
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: params.sessionId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
