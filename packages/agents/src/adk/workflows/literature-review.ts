/**
 * Literature Review Workflow
 * Orchestrates multiple agents to conduct comprehensive literature reviews
 */

import { createPlannerAgent } from '../agents/planner'
import { createSearchAgent } from '../agents/search'
import { createSynthesisAgent } from '../agents/synthesis'
import { createReportAgent } from '../agents/report'

export interface LiteratureReviewRequest {
  topic: string
  yearRange?: { from: number; to: number }
  maxPapers?: number
  reportFormat?: 'executive' | 'comprehensive' | 'technical' | 'slides'
}

export interface LiteratureReviewResult {
  plan: any
  papers: any[]
  synthesis: any
  report: string
  metadata: {
    totalPapers: number
    sources: string[]
    dateGenerated: Date
    executionTimeMs: number
  }
}

/**
 * Execute a complete literature review workflow
 */
export async function executeLiteratureReview(
  request: LiteratureReviewRequest
): Promise<LiteratureReviewResult> {
  const startTime = Date.now()
  
  console.log('🚀 Starting literature review workflow...')
  console.log('📋 Topic:', request.topic)
  
  // Step 1: Planning
  console.log('\n📝 Step 1: Planning research strategy...')
  const { runner: planner } = await createPlannerAgent()
  const planPrompt = `
Create a research plan for the following literature review:

Topic: ${request.topic}
Year Range: ${request.yearRange?.from || 2020}-${request.yearRange?.to || new Date().getFullYear()}
Max Papers: ${request.maxPapers || 50}
Report Format: ${request.reportFormat || 'comprehensive'}

Provide a detailed execution plan.
  `
  
  const planResponse = await planner.ask(planPrompt)
  console.log('✅ Plan created')
  
  // Step 2: Search for papers
  console.log('\n🔍 Step 2: Searching for papers...')
  const { runner: searcher } = await createSearchAgent()
  const searchPrompt = `
Search for research papers on: ${request.topic}

Requirements:
- Search both arXiv and Semantic Scholar
- Year range: ${request.yearRange?.from || 2020}-${request.yearRange?.to || new Date().getFullYear()}
- Find up to ${request.maxPapers || 50} papers
- Prioritize highly-cited and recent papers
- Deduplicate results

Return a structured list of papers with all metadata.
  `
  
  const searchResponse = await searcher.ask(searchPrompt)
  console.log('✅ Papers found')
  
  // Step 3: Synthesize findings
  console.log('\n🧠 Step 3: Analyzing and synthesizing...')
  const { runner: synthesizer } = await createSynthesisAgent()
  const synthesisPrompt = `
Analyze the following research papers and synthesize key findings:

${searchResponse}

Identify:
- Main themes and trends
- Key findings and contributions
- Research gaps
- Contradictions or debates
- Future directions

Provide structured analysis.
  `
  
  const synthesisResponse = await synthesizer.ask(synthesisPrompt)
  console.log('✅ Synthesis complete')
  
  // Step 4: Generate report
  console.log('\n📄 Step 4: Generating report...')
  const { runner: reporter } = await createReportAgent()
  const reportPrompt = `
Generate a ${request.reportFormat || 'comprehensive'} literature review report.

Topic: ${request.topic}

Research Plan:
${planResponse}

Papers Found:
${searchResponse}

Synthesis:
${synthesisResponse}

Create a well-structured, professional report with:
- Executive summary
- Detailed findings
- Proper citations
- Conclusions and recommendations
  `
  
  const reportResponse = await reporter.ask(reportPrompt)
  console.log('✅ Report generated')
  
  const executionTime = Date.now() - startTime
  
  console.log(`\n🎉 Literature review complete! (${executionTime}ms)`)
  
  return {
    plan: planResponse,
    papers: [], // Will be populated from searchResponse
    synthesis: synthesisResponse,
    report: reportResponse,
    metadata: {
      totalPapers: 0, // Will be counted from papers
      sources: ['arxiv', 'semantic_scholar'],
      dateGenerated: new Date(),
      executionTimeMs: executionTime,
    },
  }
}
