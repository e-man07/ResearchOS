/**
 * General Research Workflow
 * Flexible multi-agent workflow for ANY research query
 */

import { createPlannerAgent } from '../agents/planner'
import { createSearchAgent } from '../agents/search'
import { createSynthesisAgent } from '../agents/synthesis'
import { createReportAgent } from '../agents/report'
import { ArxivMCPServer, SemanticScholarMCPServer } from '@research-os/mcp-connectors'
import type { BaseSessionService } from '@iqai/adk'
import type { AgentSessionOptions as LocalAgentSessionOptions } from '../session/session-service'
import { isRateLimitError } from '../utils/llm-fallback'

export interface ResearchWorkflowRequest {
  query: string
  workflowType?: 'search' | 'analysis' | 'synthesis' | 'report' | 'full'
  options?: {
    yearRange?: { from: number; to: number }
    maxPapers?: number
    sources?: ('arxiv' | 'semantic_scholar')[]
    outputFormat?: 'summary' | 'detailed' | 'technical' | 'slides'
    includeCode?: boolean
    includeTrends?: boolean
  }
  // Session management options
  sessionService?: BaseSessionService
  sessionOptions?: LocalAgentSessionOptions
}

export interface ResearchWorkflowResult {
  query: string
  workflowType: string
  plan?: string
  papers?: any[]
  analysis?: string
  report?: string
  metadata: {
    totalPapers: number
    sources: string[]
    dateGenerated: Date
    executionTimeMs: number
    agentsUsed: string[]
  }
}

/**
 * Execute a flexible research workflow based on user query
 */
export async function executeResearchWorkflow(
  request: ResearchWorkflowRequest
): Promise<ResearchWorkflowResult> {
  const startTime = Date.now()
  const agentsUsed: string[] = []
  
  console.log('🚀 Starting research workflow...')
  console.log('📋 Query:', request.query)
  console.log('🔧 Type:', request.workflowType || 'full')
  
  const workflowType = request.workflowType || 'full'
  const options = request.options || {}
  
  let plan: string | undefined
  let papers: any[] = []
  let analysis: string | undefined
  let report: string | undefined
  
  // Track if we need to use fallback for subsequent agents
  let useFallback = false

  // Helper function to execute agent with fallback on rate limit
  async function executeWithFallback<T>(
    agentFactory: (useFallback: boolean) => Promise<{ runner: { ask: (prompt: string) => Promise<T> } }>,
    prompt: string,
    agentName: string
  ): Promise<T> {
    try {
      const { runner } = await agentFactory(useFallback)
      return await runner.ask(prompt)
    } catch (error) {
      if (isRateLimitError(error) && !useFallback) {
        console.warn(`⚠️  Rate limit hit for ${agentName}, switching to Gemini fallback...`)
        useFallback = true
        const { runner } = await agentFactory(true)
        return await runner.ask(prompt)
      }
      throw error
    }
  }

  // Step 1: Planning (for complex workflows)
  if (workflowType === 'full' || workflowType === 'analysis' || workflowType === 'report') {
    console.log('\n📝 Step 1: Planning research strategy...')
    agentsUsed.push('Planner')
    
    const planPrompt = `
Analyze this research query and create an execution plan:

Query: "${request.query}"

Workflow Type: ${workflowType}
Options: ${JSON.stringify(options, null, 2)}

Create a strategic plan for:
- What information to search for
- Which sources to prioritize
- What analysis to perform
- What deliverables to produce

Be concise but thorough.
    `
    
    plan = await executeWithFallback(
      (useFallback) => createPlannerAgent({
        sessionService: request.sessionService,
        sessionOptions: request.sessionOptions,
      }, useFallback),
      planPrompt,
      'Planner'
    )
    console.log('✅ Plan created')
  }
  
  // Step 2: Search for papers using tool-enhanced ADK-TS agent
  if (workflowType !== 'analysis') {
    console.log('\n🔍 Step 2: Searching for papers using ADK-TS agent with tools...')
    agentsUsed.push('Search')
    
    const sources = options.sources || ['arxiv', 'semantic_scholar']
    const maxPapers = options.maxPapers || 20
    const yearRange = options.yearRange || { 
      from: new Date().getFullYear() - 5, 
      to: new Date().getFullYear() 
    }
    
    // Build search instructions that guide the agent to use tools
    const searchPrompt = `
Search for research papers related to: "${request.query}"

**Requirements:**
- Use the available search tools (search_arxiv and/or search_semantic_scholar)
- Sources to search: ${sources.join(', ')}
- Year range: ${yearRange.from}-${yearRange.to}
- Maximum papers per source: ${Math.ceil(maxPapers / sources.length)}
- Prioritize: relevance and citations

${options.includeCode ? '- Prefer papers with code/implementations mentioned' : ''}
${options.includeTrends ? '- Focus on recent trends and developments from ${yearRange.from}-${yearRange.to}' : ''}

**Instructions:**
1. Use search_arxiv tool to search arXiv ${sources.includes('arxiv') ? '(required)' : '(optional)'}
2. Use search_semantic_scholar tool to search Semantic Scholar ${sources.includes('semantic_scholar') ? '(required)' : '(optional)'}
3. Combine and deduplicate results from both sources (match by title or DOI)
4. Rank papers by relevance and citation count
5. Provide a structured summary with:
   - Total unique papers found
   - Top 10 most relevant papers with full metadata
   - Key themes identified
   - Source distribution

**Important:** Use the tools to get real-time search results. Don't rely only on your training data.
    `
    
    // The agent will automatically use its tools (search_arxiv, search_semantic_scholar) 
    // when processing this prompt
    const searchResponse = await executeWithFallback(
      (useFallback) => createSearchAgent({
        sessionService: request.sessionService,
        sessionOptions: request.sessionOptions,
      }, useFallback),
      searchPrompt,
      'Search'
    )
    console.log('✅ Search agent completed (used tools to fetch real papers)')
    
    // Extract paper data from agent response
    // The agent should return structured JSON with papers, but we need to parse it
    try {
      // Try to extract JSON from the response if the agent returns structured data
      const jsonMatch = searchResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.papers && Array.isArray(parsed.papers)) {
          papers = parsed.papers
          console.log(`📄 Extracted ${papers.length} papers from agent response`)
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not parse structured papers from agent response, using text response')
      // Fallback: the agent response is text-based, which is also fine
      // The papers array will remain empty but the analysis can still proceed
    }
    
    // If agent didn't return structured papers, fall back to direct MCP calls as backup
    // This ensures we always have papers even if agent response parsing fails
    if (papers.length === 0) {
      console.log('📚 Falling back to direct MCP connector calls...')
      const allPapers: any[] = []
      
      // Fetch from arXiv
      if (sources.includes('arxiv')) {
        try {
          console.log('📚 Fetching papers from arXiv via MCP...')
          const arxiv = new ArxivMCPServer()
          const arxivResults = await arxiv.search({
            query: request.query,
            max_results: Math.floor(maxPapers / sources.length),
            start: 0,
            sort_by: 'relevance',
            sort_order: 'descending',
          })
          console.log(`✅ Found ${arxivResults.length} papers from arXiv`)
          allPapers.push(...arxivResults)
        } catch (error) {
          console.error('❌ arXiv error:', error)
        }
      }
      
      // Fetch from Semantic Scholar
      if (sources.includes('semantic_scholar')) {
        try {
          console.log('📚 Fetching papers from Semantic Scholar via MCP...')
          const semanticScholar = new SemanticScholarMCPServer()
          const ssResults = await semanticScholar.search({
            query: request.query,
            limit: Math.floor(maxPapers / sources.length),
            offset: 0,
            year: yearRange ? `${yearRange.from}-${yearRange.to}` : undefined,
          })
          console.log(`✅ Found ${ssResults.length} papers from Semantic Scholar`)
          allPapers.push(...ssResults)
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          if (errorMsg.includes('429') || errorMsg.includes('Rate limit')) {
            console.warn('⚠️  Semantic Scholar rate limit reached - continuing with arXiv papers only')
          } else {
            console.error('❌ Semantic Scholar error:', errorMsg)
          }
        }
      }
      
      // Transform papers to consistent format
      papers = allPapers.map((paper) => ({
        id: paper.arxiv_id || paper.id || `paper-${Date.now()}-${Math.random()}`,
        title: paper.title,
        abstract: paper.abstract || '',
        authors: paper.authors || [],
        year: paper.year || new Date().getFullYear(),
        month: paper.month,
        venue: paper.venue,
        pdfUrl: paper.pdf_url || paper.pdfUrl,
        htmlUrl: paper.html_url || paper.htmlUrl,
        arxivId: paper.arxiv_id || paper.arxivId,
        doi: paper.doi,
        topics: paper.topics || [],
        keywords: paper.keywords || [],
        categories: paper.categories || [],
        citations: paper.citationCount || 0,
        source: paper.source || 'arxiv',
        url: paper.pdf_url || paper.pdfUrl || paper.html_url || paper.htmlUrl || '',
      }))
      
      console.log(`📄 Fetched ${papers.length} papers via direct MCP calls (fallback)`)
    } else {
      console.log(`📄 Using ${papers.length} papers from ADK-TS agent tool results`)
    }
  }
  
  // Step 3: Analysis & Synthesis (if requested)
  if (workflowType === 'analysis' || workflowType === 'synthesis' || workflowType === 'full') {
    console.log('\n🧠 Step 3: Analyzing findings...')
    agentsUsed.push('Synthesis')
    
    // Prepare paper summaries for synthesis
    const paperSummaries = papers.map((paper, idx) => `
${idx + 1}. "${paper.title}" (${paper.year})
   Authors: ${Array.isArray(paper.authors) ? paper.authors.join(', ') : 'N/A'}
   Abstract: ${paper.abstract.substring(0, 300)}...
   Venue: ${paper.venue || 'N/A'}
`).join('\n')
    
    const synthesisPrompt = `
Analyze the research on: "${request.query}"

${papers.length > 0 ? `Papers analyzed: ${papers.length}\n\n${paperSummaries}` : 'Use your knowledge base'}

Provide:
1. **Key Findings**: Main discoveries and contributions from these papers
2. **Trends**: What's emerging vs declining based on the papers
3. **Methodologies**: Common approaches and techniques used
4. **Gaps**: What's missing or unexplored in this research
5. **Contradictions**: Debates or conflicting results between papers

${options.includeTrends ? 'Focus heavily on recent trends and future directions.' : ''}
${options.includeCode ? 'Highlight papers with open-source implementations.' : ''}

Be specific and cite evidence from the papers above.
    `
    
    analysis = await executeWithFallback(
      (useFallback) => createSynthesisAgent({
        sessionService: request.sessionService,
        sessionOptions: request.sessionOptions,
      }, useFallback),
      synthesisPrompt,
      'Synthesis'
    )
    console.log('✅ Analysis complete')
  }
  
  // Step 4: Generate Report (if requested)
  if (workflowType === 'report' || workflowType === 'full') {
    console.log('\n📄 Step 4: Generating report...')
    agentsUsed.push('Report')
    
    const outputFormat = options.outputFormat || 'detailed'
    
    const reportPrompt = `
Generate a ${outputFormat} report on: "${request.query}"

${plan ? `Research Plan:\n${plan}\n` : ''}
${papers.length > 0 ? `Papers Analyzed: ${papers.length}\n` : ''}
${analysis ? `Analysis:\n${analysis}\n` : ''}

Report Format: ${outputFormat}
- summary: 1-2 page executive summary
- detailed: 5-10 page comprehensive report
- technical: 10-20 page deep dive with methodology
- slides: 10-15 slide presentation outline

Include:
- Clear structure with headings
- Key findings and insights
- Proper citations
- Actionable recommendations
- Future directions

${options.includeCode ? 'Include section on available implementations and code.' : ''}
${options.includeTrends ? 'Emphasize trends and predictions.' : ''}

Make it professional and well-formatted.
    `
    
    report = await executeWithFallback(
      (useFallback) => createReportAgent({
        sessionService: request.sessionService,
        sessionOptions: request.sessionOptions,
      }, useFallback),
      reportPrompt,
      'Report'
    )
    console.log('✅ Report generated')
  }
  
  const executionTime = Date.now() - startTime
  
  console.log(`\n🎉 Research workflow complete! (${executionTime}ms)`)
  console.log(`📊 Agents used: ${agentsUsed.join(', ')}`)
  
  return {
    query: request.query,
    workflowType,
    plan,
    papers,
    analysis,
    report,
    metadata: {
      totalPapers: papers.length,
      sources: options.sources || ['arxiv', 'semantic_scholar'],
      dateGenerated: new Date(),
      executionTimeMs: executionTime,
      agentsUsed,
    },
  }
}
