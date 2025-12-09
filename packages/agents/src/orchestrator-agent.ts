/**
 * Orchestrator agent - coordinates multiple agents
 */

import { BaseAgent } from './base-agent'
import { SearchAgent } from './search-agent'
import { SynthesisAgent } from './synthesis-agent'
import { ReportWriterAgent } from './report-writer-agent'
import type { CreatePaper } from '@research-os/core'

export interface OrchestrationInput {
  query: string
  sources: string[]
  maxResults?: number
  generateReport?: boolean
}

export interface OrchestrationOutput {
  query: string
  papers: CreatePaper[]
  synthesis?: {
    summary: string
    keyFindings: string[]
    themes: string[]
    gaps: string[]
  }
  report?: {
    title: string
    content: string
    format: string
  }
  executionTime: number
}

export class OrchestratorAgent extends BaseAgent {
  private searchAgent: SearchAgent
  private synthesisAgent: SynthesisAgent
  private reportAgent: ReportWriterAgent

  constructor() {
    super({
      name: 'OrchestratorAgent',
      description: 'Orchestrates multi-agent research workflow',
    })

    this.searchAgent = new SearchAgent()
    this.synthesisAgent = new SynthesisAgent()
    this.reportAgent = new ReportWriterAgent()
  }

  async execute(input: OrchestrationInput): Promise<OrchestrationOutput> {
    const startTime = Date.now()

    this.logger.info('Starting orchestration', {
      query: input.query,
      sources: input.sources,
    })

    // Step 1: Search for papers
    this.logger.info('Step 1: Searching papers')
    const searchResult = await this.searchAgent.execute({
      query: input.query,
      sources: input.sources,
      maxResults: input.maxResults,
    })

    const papers = searchResult.papers

    // Step 2: Synthesize findings
    this.logger.info('Step 2: Synthesizing findings')
    const synthesis = await this.synthesisAgent.execute({
      query: input.query,
      papers,
    })

    // Step 3: Generate report (optional)
    let report
    if (input.generateReport) {
      this.logger.info('Step 3: Generating report')
      const reportResult = await this.reportAgent.execute({
        query: input.query,
        papers,
        synthesis,
      })

      report = {
        title: reportResult.title,
        content: reportResult.content,
        format: reportResult.format,
      }
    }

    const executionTime = Date.now() - startTime

    this.logger.info('Orchestration complete', {
      papers: papers.length,
      executionTime: `${executionTime}ms`,
    })

    return {
      query: input.query,
      papers,
      synthesis,
      report,
      executionTime,
    }
  }
}
