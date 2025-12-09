import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/v1/chat/sessions
// Create chat session for a search
export async function POST(request: NextRequest) {
  try {
    const { searchId, paperIds } = await request.json()

    if (!searchId || !paperIds || !Array.isArray(paperIds)) {
      return NextResponse.json(
        { error: 'searchId and paperIds array required' },
        { status: 400 }
      )
    }

    // Get search details
    const search = await prisma.search.findUnique({
      where: { id: searchId },
    })

    if (!search) {
      return NextResponse.json(
        { error: 'Search not found' },
        { status: 404 }
      )
    }

    // Check if session already exists
    const existing = await prisma.chatSession.findUnique({
      where: { searchId },
    })

    if (existing) {
      return NextResponse.json(existing)
    }

    // Create new chat session
    const session = await prisma.chatSession.create({
      data: {
        searchId,
        title: `Chat: ${search.query}`,
        description: `Ask questions about ${paperIds.length} indexed papers from your search`,
        paperIds,
        paperCount: paperIds.length,
      },
    })

    console.log(`✅ Created chat session for search: ${searchId}`)

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Error creating chat session:', error)
    return NextResponse.json(
      { error: 'Failed to create chat session' },
      { status: 500 }
    )
  }
}

// GET /api/v1/chat/sessions?searchId=xxx
// Get chat session for a search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const searchId = searchParams.get('searchId')

    if (!searchId) {
      return NextResponse.json(
        { error: 'searchId query parameter required' },
        { status: 400 }
      )
    }

    const session = await prisma.chatSession.findUnique({
      where: { searchId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100, // Last 100 messages
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error fetching chat session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat session' },
      { status: 500 }
    )
  }
}
