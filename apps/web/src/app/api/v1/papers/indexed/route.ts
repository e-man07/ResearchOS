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

    
    const workflows = await prisma.workflowExecution.findMany({
      where: { userId: user.id },
      select: {
        paperIds: true,
        query: true,
        createdAt: true,
      },
    })

   
    const workflowPaperIds = [...new Set(workflows.flatMap((w) => w.paperIds))]

    
    const indexedPapers = await prisma.paper.findMany({
      where: {
        chunks: {
          some: {}, 
        },
      },
      select: {
        id: true,
        title: true,
        abstract: true,
        year: true,
        venue: true,
        topics: true,
        keywords: true,
        pdfUrl: true,
        source: true,
        sourceId: true,
        createdAt: true,
        _count: {
          select: {
            chunks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    
    const papersWithMetadata = indexedPapers.map((paper) => {
      const usedInWorkflows = workflows
        .filter((w) => w.paperIds.includes(paper.id))
        .map((w) => ({
          query: w.query,
          date: w.createdAt,
        }))

      return {
        ...paper,
        chunkCount: paper._count.chunks,
        usedInWorkflows,
        workflowCount: usedInWorkflows.length,
        indexedViaSearch: !workflowPaperIds.includes(paper.id),
      }
    })

    return NextResponse.json({
      papers: papersWithMetadata,
      total: papersWithMetadata.length,
    })
  } catch (error) {
    console.error('Error fetching indexed papers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
