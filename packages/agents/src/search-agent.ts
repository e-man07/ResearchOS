/**
 * Search agent - orchestrates paper search
 */

import { BaseAgent } from './base-agent'
import type { CreatePaper } from '@research-os/core'

export interface SearchInput {
  query: string
  sources: string[]
  maxResults?: number
}

export interface SearchOutput {
  papers: CreatePaper[]
  totalResults: number
}

export class SearchAgent extends BaseAgent {
  constructor() {
    super({
      name: 'SearchAgent',
      description: 'Orchestrates paper search across multiple sources',
    })
  }

  async execute(input: SearchInput): Promise<SearchOutput> {
    this.logger.info('Executing search', { query: input.query })
    
    // TODO: Implement actual search logic
    const papers: CreatePaper[] = []
    
    return {
      papers,
      totalResults: papers.length,
    }
  }
}
