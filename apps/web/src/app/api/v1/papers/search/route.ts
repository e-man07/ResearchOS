/**
 * API route: /api/v1/papers/search
 * Search papers from MCP connectors (arXiv, Semantic Scholar)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ArxivMCPServer, SemanticScholarMCPServer } from '@research-os/mcp-connectors'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { query, sources = ['arxiv', 'semantic_scholar'], maxResults = 20, yearFrom, yearTo } = body

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Create search record
    const search = await prisma.search.create({
      data: {
        userId: session.user.id,
        query,
        status: 'PENDING',
      },
    })

    const allPapers: any[] = []
    const errors: any[] = []

    // Fetch from arXiv
    if (sources.includes('arxiv')) {
      try {
        console.log('Fetching from arXiv:', query)
        const arxiv = new ArxivMCPServer()
        const arxivResults = await arxiv.search({
          query,
          max_results: Math.floor(maxResults / sources.length),
          start: 0,
          sort_by: 'relevance',
          sort_order: 'descending',
        })
        
        console.log(`Found ${arxivResults.length} papers from arXiv`)
        allPapers.push(...arxivResults)
      } catch (error) {
        console.error('arXiv error:', error)
        errors.push({ source: 'arxiv', error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    // Fetch from Semantic Scholar
    if (sources.includes('semantic_scholar')) {
      try {
        console.log('Fetching from Semantic Scholar:', query)
        const semanticScholar = new SemanticScholarMCPServer()
        const ssResults = await semanticScholar.search({
          query,
          limit: Math.floor(maxResults / sources.length),
          offset: 0,
          year: yearFrom ? `${yearFrom}-${yearTo || new Date().getFullYear()}` : undefined,
        })
        
        console.log(`Found ${ssResults.length} papers from Semantic Scholar`)
        allPapers.push(...ssResults)
      } catch (error) {
        console.error('Semantic Scholar error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
          errors.push({ 
            source: 'semantic_scholar', 
            error: 'Rate limit exceeded. Try again in a few minutes or use arXiv only.' 
          })
        } else {
          errors.push({ source: 'semantic_scholar', error: errorMessage })
        }
      }
    }

    // Save papers to database
    const savedPapers = await Promise.all(
      allPapers.map(async (paper) => {
        try {
          // Upsert paper using source and sourceId as unique identifier
          const savedPaper = await prisma.paper.upsert({
            where: {
              source_sourceId: {
                source: paper.source || 'arxiv',
                sourceId: paper.arxiv_id || paper.id || `temp-${Date.now()}`,
              },
            },
            create: {
              title: paper.title,
              abstract: paper.abstract || '',
              year: paper.year || new Date().getFullYear(),
              month: paper.month,
              venue: paper.venue,
              pdfUrl: paper.pdf_url,
              htmlUrl: paper.html_url,
              arxivId: paper.arxiv_id,
              doi: paper.doi,
              topics: paper.topics || [],
              keywords: paper.keywords || [],
              categories: paper.categories || [],
              citations: 0,
              source: paper.source || 'arxiv',
              sourceId: paper.arxiv_id || paper.id || `temp-${Date.now()}`,
              rawJson: paper as any,
            },
            update: {
              title: paper.title,
              abstract: paper.abstract || '',
            },
          })

          // Add authors to the paper object for frontend display
          return {
            ...savedPaper,
            authors: paper.authors || [],
            citationCount: savedPaper.citations || 0,
            url: savedPaper.pdfUrl || savedPaper.htmlUrl || '',
          }
        } catch (error) {
          console.error('Error saving paper:', paper.title, error)
          return null
        }
      })
    )

    const validPapers = savedPapers.filter((p) => p !== null)

    // Update search status
    await prisma.search.update({
      where: { id: search.id },
      data: {
        status: validPapers.length > 0 ? 'COMPLETED' : 'FAILED',
        totalResults: validPapers.length,
        errorMessage: errors.length > 0 ? JSON.stringify(errors) : null,
      },
    })

    return NextResponse.json({
      searchId: search.id,
      papers: validPapers,
      totalResults: validPapers.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
