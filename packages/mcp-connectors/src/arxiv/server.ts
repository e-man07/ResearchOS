/**
 * arXiv MCP Server
 * Implements MCP interface for arXiv API
 */

import axios from 'axios'
import xml2js from 'xml2js'
import { z } from 'zod'
import { MCPServerBase } from '../base/mcp-server-base'
import { ArxivSearchOptionsSchema, type ArxivEntry } from './types'
import { normalizeArxivEntry } from './normalizer'
import type { CreatePaper } from '@research-os/core'

const ARXIV_API_BASE = 'http://export.arxiv.org/api/query'

export class ArxivMCPServer extends MCPServerBase {
  constructor() {
    super({
      name: 'arxiv-mcp-server',
      version: '1.0.0',
      rateLimit: {
        tokensPerInterval: 3, // 3 requests per second (polite use)
        interval: 1000,
      },
    })
  }

  protected registerTools(): void {
    this.registerSearchTool()
    this.registerFetchPaperTool()
    this.registerGetCategoriesTool()
  }

  /**
   * Register search papers tool
   */
  private registerSearchTool(): void {
    this.server.registerTool(
      'search_papers',
      {
        title: 'Search arXiv Papers',
        description: 'Search for papers on arXiv by query string',
        inputSchema: ArxivSearchOptionsSchema.shape,
        outputSchema: {
          papers: z.array(z.unknown()),
          total_results: z.number(),
          start_index: z.number(),
        },
      },
      async (options) => {
        try {
          const papers = await this.searchPapers(options)
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                papers,
                total_results: papers.length,
                start_index: options.start,
              }),
            }],
            structuredContent: {
              papers,
              total_results: papers.length,
              start_index: options.start,
            },
          }
        } catch (error) {
          this.handleAPIError('arXiv', error)
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
        title: 'Fetch arXiv Paper',
        description: 'Fetch a specific paper by arXiv ID',
        inputSchema: {
          arxiv_id: z.string().min(1, 'arXiv ID is required'),
        },
        outputSchema: {
          paper: z.unknown(),
        },
      },
      async ({ arxiv_id }) => {
        try {
          const paper = await this.fetchPaper(arxiv_id)
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ paper }),
            }],
            structuredContent: { paper },
          }
        } catch (error) {
          this.handleAPIError('arXiv', error)
        }
      }
    )
  }

  /**
   * Register get categories tool
   */
  private registerGetCategoriesTool(): void {
    this.server.registerTool(
      'get_categories',
      {
        title: 'Get arXiv Categories',
        description: 'Get list of available arXiv categories',
        inputSchema: {},
        outputSchema: {
          categories: z.array(z.object({
            id: z.string(),
            name: z.string(),
          })),
        },
      },
      async () => {
        const categories = this.getCategories()
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ categories }),
          }],
          structuredContent: { categories },
        }
      }
    )
  }

  /**
   * Search papers on arXiv (public method for direct API usage)
   */
  public async search(options: z.infer<typeof ArxivSearchOptionsSchema>): Promise<CreatePaper[]> {
    return this.searchPapers(options)
  }

  /**
   * Search papers on arXiv (internal)
   */
  private async searchPapers(options: z.infer<typeof ArxivSearchOptionsSchema>): Promise<CreatePaper[]> {
    return this.executeWithRateLimit(async () => {
      const params = new URLSearchParams({
        search_query: `all:${options.query}`,
        start: options.start.toString(),
        max_results: options.max_results.toString(),
        sortBy: options.sort_by,
        sortOrder: options.sort_order,
      })

      this.logger.info('Searching arXiv', { query: options.query, max_results: options.max_results })

      const response = await axios.get(`${ARXIV_API_BASE}?${params.toString()}`, {
        timeout: 30000,
        headers: {
          'User-Agent': 'ResearchOS/1.0 (https://research-os.dev)',
        },
      })

      const parsed = await xml2js.parseStringPromise(response.data, {
        explicitArray: false,
        mergeAttrs: true,
      })

      const entries = parsed.feed.entry
      if (!entries) {
        this.logger.info('No results found')
        return []
      }

      // Handle single entry (not in array)
      const entryArray = Array.isArray(entries) ? entries : [entries]

      this.logger.info(`Found ${entryArray.length} papers`)

      return entryArray.map((entry: ArxivEntry) => normalizeArxivEntry(entry))
    })
  }

  /**
   * Fetch a specific paper by arXiv ID
   */
  private async fetchPaper(arxivId: string): Promise<CreatePaper> {
    return this.executeWithRateLimit(async () => {
      const params = new URLSearchParams({
        id_list: arxivId,
      })

      this.logger.info('Fetching paper', { arxiv_id: arxivId })

      const response = await axios.get(`${ARXIV_API_BASE}?${params.toString()}`, {
        timeout: 30000,
        headers: {
          'User-Agent': 'ResearchOS/1.0 (https://research-os.dev)',
        },
      })

      const parsed = await xml2js.parseStringPromise(response.data, {
        explicitArray: false,
        mergeAttrs: true,
      })

      const entry = parsed.feed.entry
      if (!entry) {
        throw new Error(`Paper with arXiv ID ${arxivId} not found`)
      }

      return normalizeArxivEntry(entry as ArxivEntry)
    })
  }

  /**
   * Get arXiv categories
   */
  private getCategories(): Array<{ id: string; name: string }> {
    // Major arXiv categories
    return [
      { id: 'cs.AI', name: 'Artificial Intelligence' },
      { id: 'cs.CL', name: 'Computation and Language' },
      { id: 'cs.CV', name: 'Computer Vision and Pattern Recognition' },
      { id: 'cs.LG', name: 'Machine Learning' },
      { id: 'cs.NE', name: 'Neural and Evolutionary Computing' },
      { id: 'stat.ML', name: 'Machine Learning (Statistics)' },
      { id: 'math.OC', name: 'Optimization and Control' },
      { id: 'physics.comp-ph', name: 'Computational Physics' },
      { id: 'q-bio', name: 'Quantitative Biology' },
      { id: 'quant-ph', name: 'Quantum Physics' },
    ]
  }

  /**
   * Health check - verify arXiv API is accessible
   */
  protected override async performHealthCheck(): Promise<void> {
    await axios.get(ARXIV_API_BASE, {
      timeout: 5000,
      params: {
        search_query: 'all:test',
        max_results: 1,
      },
    })
  }
}
