/**
 * API route: /api/v1/workflows/history
 * Get workflow execution history for the current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get workflow executions
    const workflows = await prisma.workflowExecution.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 workflows
      select: {
        id: true,
        query: true,
        workflowType: true,
        status: true,
        agentsUsed: true,
        executionTimeMs: true,
        totalPapers: true,
        chatSessionId: true,
        createdAt: true,
        completedAt: true,
      },
    })

    return NextResponse.json(workflows)
  } catch (error) {
    console.error('Error fetching workflow history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow history' },
      { status: 500 }
    )
  }
}
