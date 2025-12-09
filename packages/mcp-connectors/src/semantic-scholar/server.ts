/**
 * Semantic Scholar MCP Server
 * Implements MCP interface for Semantic Scholar API
 */

import axios from 'axios'
import { z } from 'zod'
import { MCPServerBase } from '../base/mcp-server-base'
import {
  SemanticScholarSearchOptionsSchema,
  SemanticScholarSearchResponseSchema,
  SemanticScholarPaperDetailsSchema,
  type SemanticScholarPaper,
} from './types'
import { normalizeSemanticScholarPaper } from './normalizer'
import type { CreatePaper } from '@research-os/core'

const SEMANTIC_SCHOLAR_API_BASE = 'https://api.semanticscholar.org/graph/v1'

// Default fields to request
const DEFAULT_FIELDS = [
  'paperId',
  'title',
  'abstract',
  'year',
  'venue',
  'authors',
  'citationCount',
  'referenceCount',
  'influentialCitationCount',
  'isOpenAccess',
  'fieldsOfStudy',
  'publicationTypes',
  'publicationDate',
  'journal',
  'externalIds',
  'url',
  'openAccessPdf',
].join(',')

export class SemanticScholarMCPServer extends MCPServerBase {
  private apiKey?: string

  constructor(apiKey?: string) {
    super({
      name: 'semantic-scholar-mcp-server',
      version: '1.0.0',
      rateLimit: {
        tokensPerInterval: apiKey ? 100 : 1, // 100 req/sec with API key, 1 req/sec without
        interval: 1000,
      },
    })
    this.apiKey = apiKey
  }

  protected registerTools(): void {
    this.registerSearchTool()
    this.registerFetchPaperTool()
    this.registerGetRecommendationsTool()
  }

  /**
   * Register search papers tool
   */
  private registerSearchTool(): void {
    this.server.registerTool(
      'search_papers',
      {
        title: 'Search Semantic Scholar Papers',
        description: 'Search for papers on Semantic Scholar by query string with filters',
        inputSchema: SemanticScholarSearchOptionsSchema.shape,
        outputSchema: {
          papers: z.array(z.unknown()),
          total_results: z.number(),
          offset: z.number(),
        },
      },
      async (options: z.infer<typeof SemanticScholarSearchOptionsSchema>) => {
        try {
          const papers = await this.searchPapers(options)
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                papers,
                total_results: papers.length,
                offset: options.offset,
              }),
            }],
            structuredContent: {
              papers,
              total_results: papers.length,
              offset: options.offset,
            },
          }
        } catch (error) {
          this.handleAPIError('Semantic Scholar', error)
        }
      }
    )
  }

  /**
   * Register fetch paper by ID tool
   */
  private registerFetchPaperTool(): void {
    this.server.registerTool(
      'fetch_paper',
      {
        title: 'Fetch Semantic Scholar Paper',
        description: 'Fetch a specific paper by Semantic Scholar ID, DOI, or arXiv ID',
        inputSchema: {
          paper_id: z.string().min(1, 'Paper ID is required'),
        },
        outputSchema: {
          paper: z.unknown(),
        },
      },
      async ({ paper_id }: { paper_id: string }) => {
        try {
          const paper = await this.fetchPaper(paper_id)
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ paper }),
            }],
            structuredContent: { paper },
          }
        } catch (error) {
          this.handleAPIError('Semantic Scholar', error)
        }
      }
    )
  }

  /**
   * Register get recommendations tool
   */
  private registerGetRecommendationsTool(): void {
    this.server.registerTool(
      'get_recommendations',
      {
        title: 'Get Paper Recommendations',
        description: 'Get recommended papers based on a paper ID',
        inputSchema: {
          paper_id: z.string().min(1, 'Paper ID is required'),
          limit: z.number().int().min(1).max(100).default(10),
        },
        outputSchema: {
          papers: z.array(z.unknown()),
        },
      },
      async ({ paper_id, limit }: { paper_id: string; limit: number }) => {
        try {
          const papers = await this.getRecommendations(paper_id, limit)
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ papers }),
            }],
            structuredContent: { papers },
          }
        } catch (error) {
          this.handleAPIError('Semantic Scholar', error)
        }
      }
    )
  }

  /**
   * Search papers on Semantic Scholar (public method for direct API usage)
   */
  public async search(options: z.infer<typeof SemanticScholarSearchOptionsSchema>): Promise<CreatePaper[]> {
    return this.searchPapers(options)
  }

  /**
   * Search papers on Semantic Scholar (internal)
   */
  private async searchPapers(
    options: z.infer<typeof SemanticScholarSearchOptionsSchema>
  ): Promise<CreatePaper[]> {
    return this.executeWithRateLimit(async () => {
      const params: Record<string, string | number> = {
        query: options.query,
        limit: options.limit,
        offset: options.offset,
        fields: options.fields?.join(',') || DEFAULT_FIELDS,
      }

      // Add optional filters
      if (options.year) params.year = options.year
      if (options.venue) params.venue = options.venue.join(',')
      if (options.fieldsOfStudy) params.fieldsOfStudy = options.fieldsOfStudy.join(',')
      if (options.publicationTypes) params.publicationTypes = options.publicationTypes.join(',')
      if (options.minCitationCount !== undefined) params.minCitationCount = options.minCitationCount

      this.logger.info('Searching Semantic Scholar', { query: options.query, limit: options.limit })

      const response = await axios.get(`${SEMANTIC_SCHOLAR_API_BASE}/paper/search`, {
        params,
        timeout: 30000,
        headers: this.getHeaders(),
      })

      const parsed = SemanticScholarSearchResponseSchema.parse(response.data)

      this.logger.info(`Found ${parsed.data.length} papers (total: ${parsed.total})`)

      return parsed.data.map((paper: SemanticScholarPaper) => normalizeSemanticScholarPaper(paper))
    })
  }

  /**
   * Fetch a specific paper by ID
   */
  private async fetchPaper(paperId: string): Promise<CreatePaper> {
    return this.executeWithRateLimit(async () => {
      this.logger.info('Fetching paper', { paper_id: paperId })

      const response = await axios.get(`${SEMANTIC_SCHOLAR_API_BASE}/paper/${paperId}`, {
        params: {
          fields: DEFAULT_FIELDS,
        },
        timeout: 30000,
        headers: this.getHeaders(),
      })

      const paper = SemanticScholarPaperDetailsSchema.parse(response.data)

      return normalizeSemanticScholarPaper(paper)
    })
  }

  /**
   * Get recommended papers based on a paper ID
   */
  private async getRecommendations(paperId: string, limit: number): Promise<CreatePaper[]> {
    return this.executeWithRateLimit(async () => {
      this.logger.info('Getting recommendations', { paper_id: paperId, limit })

      const response = await axios.get(
        `${SEMANTIC_SCHOLAR_API_BASE}/paper/${paperId}/recommendations`,
        {
          params: {
            limit,
            fields: DEFAULT_FIELDS,
          },
          timeout: 30000,
          headers: this.getHeaders(),
        }
      )

      const data = z.object({
        recommendedPapers: z.array(SemanticScholarPaperDetailsSchema),
      }).parse(response.data)

      this.logger.info(`Found ${data.recommendedPapers.length} recommendations`)

      return data.recommendedPapers.map((paper) => normalizeSemanticScholarPaper(paper))
    })
  }

  /**
   * Get request headers
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'ResearchOS/1.0 (https://research-os.dev)',
    }

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey
    }

    return headers
  }

  /**
   * Health check - verify Semantic Scholar API is accessible
   */
  protected override async performHealthCheck(): Promise<void> {
    await axios.get(`${SEMANTIC_SCHOLAR_API_BASE}/paper/search`, {
      timeout: 5000,
      params: {
        query: 'test',
        limit: 1,
      },
      headers: this.getHeaders(),
    })
  }
}
