# ResearchOS - Integration Examples

Complete examples showing how to use ResearchOS components together.

---

## Example 1: Complete Paper Search Flow

Search for papers, save to database, and display results.

```typescript
import { ArxivMCPServer, SemanticScholarMCPServer } from '@research-os/mcp-connectors'
import { PaperFetcher } from '@research-os/ingestion'
import { prisma } from '@/lib/prisma'

async function searchAndSavePapers(query: string, userId: string) {
  // 1. Initialize connectors
  const arxiv = new ArxivMCPServer()
  const semanticScholar = new SemanticScholarMCPServer()
  
  // 2. Create search record
  const search = await prisma.search.create({
    data: {
      userId,
      query,
      status: 'PENDING',
    },
  })
  
  try {
    // 3. Search both sources
    const [arxivResults, ssResults] = await Promise.all([
      arxiv.searchPapers({ query, max_results: 10 }),
      semanticScholar.searchPapers({ query, limit: 10 }),
    ])
    
    // 4. Combine and deduplicate results
    const allPapers = [...arxivResults.papers, ...ssResults.papers]
    
    // 5. Save papers to database
    const savedPapers = await Promise.all(
      allPapers.map(async (paper) => {
        return prisma.paper.upsert({
          where: { externalId: paper.id },
          create: {
            externalId: paper.id,
            title: paper.title,
            abstract: paper.abstract || '',
            authors: {
              create: paper.authors.map((a) => ({ name: a.name })),
            },
            year: paper.year,
            venue: paper.venue,
            citationCount: paper.citationCount || 0,
            url: paper.url,
            source: paper.source,
          },
          update: {},
        })
      })
    )
    
    // 6. Update search status
    await prisma.search.update({
      where: { id: search.id },
      data: {
        status: 'COMPLETED',
        totalResults: savedPapers.length,
      },
    })
    
    return { search, papers: savedPapers }
  } catch (error) {
    // Handle error
    await prisma.search.update({
      where: { id: search.id },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    })
    throw error
  }
}
```

---

## Example 2: RAG-Based Paper Analysis

Index papers and perform semantic search.

```typescript
import { WeaviateVectorStore, EmbeddingService, RAGPipeline } from '@research-os/rag'
import { TextChunker } from '@research-os/ingestion'
import { prisma } from '@/lib/prisma'

async function indexAndSearchPapers(paperId: string, searchQuery: string) {
  // 1. Initialize RAG components
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
  
  // 2. Get paper from database
  const paper = await prisma.paper.findUnique({
    where: { id: paperId },
  })
  
  if (!paper) throw new Error('Paper not found')
  
  // 3. Chunk the paper
  const chunker = new TextChunker({
    chunkSize: 512,
    chunkOverlap: 50,
  })
  
  const chunks = chunker.chunk(paper.abstract, paper.id)
  
  // 4. Save chunks to database
  await prisma.chunk.createMany({
    data: chunks.map((chunk) => ({
      paperId: paper.id,
      content: chunk.content,
      chunkIndex: chunk.chunk_index,
      section: chunk.section,
      metadata: chunk.metadata,
    })),
  })
  
  // 5. Index chunks in vector store
  await ragPipeline.indexChunks(chunks)
  
  // 6. Perform semantic search
  const context = await ragPipeline.retrieve(searchQuery, {
    limit: 5,
    hybrid: true,
    alpha: 0.75,
  })
  
  return context
}
```

---

## Example 3: Multi-Agent Research Report

Use agents to search, synthesize, and generate reports.

```typescript
import { OrchestratorAgent } from '@research-os/agents'
import { prisma } from '@/lib/prisma'

async function generateResearchReport(query: string, userId: string) {
  // 1. Initialize orchestrator
  const orchestrator = new OrchestratorAgent()
  
  // 2. Create search record
  const search = await prisma.search.create({
    data: {
      userId,
      query,
      status: 'PENDING',
    },
  })
  
  try {
    // 3. Run orchestration (search → synthesis → report)
    const result = await orchestrator.execute({
      query,
      sources: ['arxiv', 'semantic_scholar'],
      maxResults: 20,
      generateReport: true,
    })
    
    // 4. Save papers
    const savedPapers = await Promise.all(
      result.papers.map(async (paper) => {
        return prisma.paper.upsert({
          where: { externalId: paper.id },
          create: {
            externalId: paper.id,
            title: paper.title,
            abstract: paper.abstract || '',
            authors: {
              create: paper.authors.map((a) => ({ name: a.name })),
            },
            year: paper.year,
            venue: paper.venue,
            citationCount: paper.citationCount || 0,
            url: paper.url,
            source: paper.source,
          },
          update: {},
        })
      })
    )
    
    // 5. Update search
    await prisma.search.update({
      where: { id: search.id },
      data: {
        status: 'COMPLETED',
        totalResults: savedPapers.length,
        executionTimeMs: result.executionTime,
      },
    })
    
    return {
      search,
      papers: savedPapers,
      synthesis: result.synthesis,
      report: result.report,
    }
  } catch (error) {
    await prisma.search.update({
      where: { id: search.id },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    })
    throw error
  }
}
```

---

## Example 4: API Route Integration

Complete API route using all components.

```typescript
// app/api/v1/research/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ArxivMCPServer } from '@research-os/mcp-connectors'
import { TextChunker } from '@research-os/ingestion'
import { WeaviateVectorStore, EmbeddingService, RAGPipeline } from '@research-os/rag'
import { SynthesisAgent } from '@research-os/agents'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  // 1. Check authentication
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { query } = await request.json()
  
  // 2. Search papers
  const arxiv = new ArxivMCPServer()
  const results = await arxiv.searchPapers({ query, max_results: 10 })
  
  // 3. Save to database
  const papers = await Promise.all(
    results.papers.map(async (paper) => {
      return prisma.paper.upsert({
        where: { externalId: paper.id },
        create: {
          externalId: paper.id,
          title: paper.title,
          abstract: paper.abstract || '',
          authors: { create: paper.authors.map((a) => ({ name: a.name })) },
          year: paper.year,
          url: paper.url,
          source: 'arxiv',
        },
        update: {},
      })
    })
  )
  
  // 4. Chunk and index
  const chunker = new TextChunker({ chunkSize: 512, chunkOverlap: 50 })
  const vectorStore = new WeaviateVectorStore({
    url: process.env.WEAVIATE_URL!,
    apiKey: process.env.WEAVIATE_API_KEY,
  })
  const embeddingService = new EmbeddingService({
    apiKey: process.env.OPENAI_API_KEY!,
  })
  const ragPipeline = new RAGPipeline({ vectorStore, embeddingService })
  
  for (const paper of papers) {
    const chunks = chunker.chunk(paper.abstract, paper.id)
    await ragPipeline.indexChunks(chunks)
  }
  
  // 5. Generate synthesis
  const synthesisAgent = new SynthesisAgent()
  const synthesis = await synthesisAgent.execute({
    query,
    papers: results.papers,
  })
  
  return NextResponse.json({
    papers,
    synthesis,
    totalResults: papers.length,
  })
}
```

---

## Example 5: Frontend Integration

Complete React component using all features.

```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { SearchForm } from '@/components/search/SearchForm'
import { SearchResults } from '@/components/search/SearchResults'

export default function ResearchPage() {
  const { data: session } = useSession()
  const [papers, setPapers] = useState([])
  const [synthesis, setSynthesis] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSearch = async (data) => {
    setIsLoading(true)
    
    try {
      // Call integrated API
      const response = await fetch('/api/v1/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: data.query }),
      })
      
      const result = await response.json()
      setPapers(result.papers)
      setSynthesis(result.synthesis)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto py-12">
      <SearchForm onSearch={handleSearch} isLoading={isLoading} />
      
      {synthesis && (
        <div className="my-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">AI Synthesis</h2>
          <p>{synthesis.summary}</p>
          <ul className="mt-4">
            {synthesis.keyFindings.map((finding, i) => (
              <li key={i}>• {finding}</li>
            ))}
          </ul>
        </div>
      )}
      
      <SearchResults
        papers={papers}
        isLoading={isLoading}
        query={data?.query}
      />
    </div>
  )
}
```

---

## Testing Examples

### Test Paper Search
```bash
curl -X POST http://localhost:3000/api/v1/searches \
  -H "Content-Type: application/json" \
  -d '{
    "query": "transformer models in NLP",
    "filters": {
      "sources": ["arxiv"],
      "yearFrom": 2020
    }
  }'
```

### Test RAG Search
```bash
curl -X POST http://localhost:3000/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "how do attention mechanisms work",
    "limit": 5,
    "hybrid": true
  }'
```

### Test Report Generation
```bash
curl -X POST http://localhost:3000/api/v1/reports/SEARCH_ID \
  -H "Content-Type: application/json"
```

---

## Environment Setup

Make sure all required environment variables are set:

```env
# Database
DATABASE_URL="postgresql://..."

# Weaviate
WEAVIATE_URL="https://..."
WEAVIATE_API_KEY="..."

# OpenAI
OPENAI_API_KEY="sk-..."

# NextAuth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

---

## Complete Workflow

1. **User registers/signs in** → NextAuth handles authentication
2. **User searches for papers** → MCP connectors fetch from arXiv/Semantic Scholar
3. **Papers are saved** → Prisma stores in PostgreSQL
4. **Papers are chunked** → TextChunker splits into manageable pieces
5. **Chunks are indexed** → Weaviate stores with embeddings
6. **User asks questions** → RAG retrieves relevant context
7. **AI generates insights** → Agents synthesize and create reports
8. **Results displayed** → React components show beautiful UI

---

**All components work together seamlessly!** 🚀
