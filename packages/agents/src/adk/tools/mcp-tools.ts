/**
 * ADK-TS Tools that wrap MCP connectors and RAG functionality
 * These tools can be used by ADK-TS agents to interact with research data sources
 */

import { createTool, type ToolContext } from '@iqai/adk'
import { z } from 'zod'
import { ArxivMCPServer, SemanticScholarMCPServer } from '@research-os/mcp-connectors'
import type { RAGPipeline } from '@research-os/rag'

// Workaround for Zod v3/v4 compatibility with ADK
// ADK uses Zod v4 internally but we're using Zod v3
// The schema structure is incompatible, so we validate in the function

/**
 * Tool for searching arXiv papers
 * Uses the public search() method from ArxivMCPServer
 */
export function createSearchArxivTool() {
  // Define schema for validation (not passed to ADK to avoid Zod v3/v4 incompatibility)
  const arxivSearchSchema = z.object({
    query: z.string(),
    max_results: z.number().int().min(1).max(50).optional(),
    start: z.number().int().min(0).optional(),
    sort_by: z.enum(['relevance', 'lastUpdatedDate', 'submittedDate']).optional(),
    sort_order: z.enum(['ascending', 'descending']).optional(),
  })

  return createTool({
    name: 'search_arxiv',
    description: 'Search for research papers on arXiv by query string. Returns papers with titles, abstracts, authors, publication dates, and metadata. Use this to find recent or historical papers on any research topic. Parameters: query (required string), max_results (optional number 1-50, default 10), start (optional number, default 0), sort_by (optional: relevance|lastUpdatedDate|submittedDate, default relevance), sort_order (optional: ascending|descending, default descending).',
    fn: async (args: Record<string, any>, _context: ToolContext) => {
      // Validate with Zod before processing
      const validated = arxivSearchSchema.parse(args)
      const { query, max_results = 10, start = 0, sort_by = 'relevance', sort_order = 'descending' } = validated
      
      const arxiv = new ArxivMCPServer()
      
      try {
        const papers = await arxiv.search({
          query,
          max_results,
          start,
          sort_by,
          sort_order,
        })
        
        return {
          success: true,
          papers: papers.map((paper) => ({
            id: paper.arxiv_id || paper.source_id,
            title: paper.title,
            abstract: paper.abstract,
            authors: paper.authors,
            year: paper.year,
            month: paper.month,
            categories: paper.categories,
            pdf_url: paper.pdf_url,
            html_url: paper.html_url,
            arxiv_id: paper.arxiv_id,
            doi: paper.doi,
            url: paper.pdf_url || paper.html_url || '',
          })),
          count: papers.length,
          total_results: papers.length,
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          success: false,
          error: errorMessage,
          papers: [],
          count: 0,
        }
      }
    },
  })
}

/**
 * Tool for searching Semantic Scholar papers
 * Uses the public search() method from SemanticScholarMCPServer
 */
export function createSearchSemanticScholarTool() {
  // Define schema for validation (not passed to ADK to avoid Zod v3/v4 incompatibility)
  const semanticScholarSearchSchema = z.object({
    query: z.string(),
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
    year: z.string().optional(),
    venue: z.array(z.string()).optional(),
    fieldsOfStudy: z.array(z.string()).optional(),
    minCitationCount: z.number().int().min(0).optional(),
  })

  return createTool({
    name: 'search_semantic_scholar',
    description: 'Search for research papers on Semantic Scholar with citation data and influence metrics. Returns papers with titles, abstracts, authors, citation counts, venue information, and related papers. Use this for papers with citation analysis and academic metadata. Parameters: query (required string), limit (optional number 1-100, default 10), offset (optional number, default 0), year (optional string like "2020-2024"), venue (optional string array), fieldsOfStudy (optional string array), minCitationCount (optional number).',
    fn: async (args: Record<string, any>, _context: ToolContext) => {
      // Validate with Zod before processing
      const validated = semanticScholarSearchSchema.parse(args)
      const { 
        query, 
        limit = 10, 
        offset = 0, 
        year,
        venue,
        fieldsOfStudy,
        minCitationCount,
      } = validated
      const semanticScholar = new SemanticScholarMCPServer(process.env.SEMANTIC_SCHOLAR_API_KEY)
      
      try {
        const papers = await semanticScholar.search({
          query,
          limit,
          offset,
          year,
          venue,
          fieldsOfStudy,
          minCitationCount,
        })
        
        return {
          success: true,
          papers: papers.map((paper) => ({
            id: paper.semantic_scholar_id || paper.source_id,
            title: paper.title,
            abstract: paper.abstract,
            authors: paper.authors,
            year: paper.year,
            venue: paper.venue,
            citations: paper.citations || 0,
            references_count: paper.references?.length || 0,
            pdf_url: paper.pdf_url,
            html_url: paper.html_url,
            doi: paper.doi,
            url: paper.pdf_url || paper.html_url || '',
            topics: paper.topics || [],
            keywords: paper.keywords || [],
          })),
          count: papers.length,
          total_results: papers.length,
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          success: false,
          error: errorMessage,
          papers: [],
          count: 0,
        }
      }
    },
  })
}

/**
 * Tool for RAG-based retrieval from vector store
 * This tool retrieves semantically similar content from indexed papers
 */
export function createRetrieveSimilarTool(ragPipeline: RAGPipeline) {
  // Define schema for validation (not passed to ADK to avoid Zod v3/v4 incompatibility)
  const retrieveSimilarSchema = z.object({
    query: z.string(),
    limit: z.number().int().min(1).max(20).optional(),
    minScore: z.number().min(0).max(1).optional(),
  })

  return createTool({
    name: 'retrieve_similar',
    description: 'Retrieve semantically similar content from indexed research papers using vector search. This tool searches through previously indexed paper chunks to find content that is semantically related to the query. Use this when you need to find specific information from papers that have already been indexed in the vector database. Parameters: query (required string), limit (optional number 1-20, default 5), minScore (optional number 0-1, default 0.7).',
    fn: async (args: Record<string, any>, _context: ToolContext) => {
      // Validate with Zod before processing
      const validated = retrieveSimilarSchema.parse(args)
      const { query, limit = 5, minScore = 0.7 } = validated
      try {
        const context = await ragPipeline.retrieve(query, {
          limit,
          minScore,
        })
        
        return {
          success: true,
          query,
          chunks: context.chunks.map((chunk, idx) => ({
            index: idx + 1,
            content: chunk.content,
            paperId: chunk.paperId,
            score: chunk.score,
            metadata: chunk.metadata || {},
          })),
          totalChunks: context.totalChunks,
          formattedContext: ragPipeline.formatContext(context),
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          success: false,
          error: errorMessage,
          query,
          chunks: [],
          totalChunks: 0,
        }
      }
    },
  })
}

/**
 * Helper function to create all MCP tools
 * This is useful when setting up agents that need multiple tools
 */
export function createMCPTools(ragPipeline?: RAGPipeline) {
  const tools = [
    createSearchArxivTool(),
    createSearchSemanticScholarTool(),
  ]
  
  if (ragPipeline) {
    tools.push(createRetrieveSimilarTool(ragPipeline))
  }
  
  return tools
}