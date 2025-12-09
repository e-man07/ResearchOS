import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/v1/chat/sessions/history
// Get all chat sessions for the current user
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all chat sessions for user's searches
    const chatSessions = await prisma.chatSession.findMany({
      where: {
        search: {
          userId: user.id,
        },
      },
      orderBy: [
        {
          lastMessageAt: 'desc', // Most recent first
        },
        {
          createdAt: 'desc', // Fallback to creation date
        },
      ],
      select: {
        id: true,
        searchId: true,
        title: true,
        description: true,
        paperCount: true,
        totalMessages: true,
        lastMessageAt: true,
        createdAt: true,
      },
    })

    console.log(`📊 Found ${chatSessions.length} chat sessions for user ${user.id}`)

    return NextResponse.json(chatSessions)
  } catch (error) {
    console.error('Error fetching chat history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    )
  }
}
