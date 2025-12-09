/**
 * Search Agent - Executes paper searches via MCP connectors using ADK tools
 */

import { AgentBuilder, type BaseSessionService } from '@iqai/adk'
import { createSearchArxivTool, createSearchSemanticScholarTool } from '../tools/mcp-tools.js'
import type { AgentSessionOptions } from '../session/session-service.js'
import { getModelForAgent } from '../utils/llm-fallback.js'
import * as dotenv from 'dotenv'

dotenv.config()

export interface SearchAgentOptions {
  sessionService?: BaseSessionService
  sessionOptions?: AgentSessionOptions
}

export async function createSearchAgent(options?: SearchAgentOptions, useFallback = false) {
  // Create the search tools
  const arxivTool = createSearchArxivTool()
  const semanticScholarTool = createSearchSemanticScholarTool()

  const builder = AgentBuilder.create('paper_search')
    .withModel(getModelForAgent(useFallback))
    .withDescription('Searches for research papers across multiple sources using real-time search tools')
    .withTools(arxivTool, semanticScholarTool)
  
  // Add session service if provided
  if (options?.sessionService && options?.sessionOptions) {
    builder.withSessionService(options.sessionService, {
      userId: options.sessionOptions.userId,
      appName: options.sessionOptions.appName || 'research-os',
      sessionId: options.sessionOptions.sessionId,
    })
  }

  return await builder
    .withInstruction(`
You are a Paper Search Agent. Your role is to:

1. **Search** for relevant research papers using the available search tools
2. **Filter** and rank results by relevance
3. **Deduplicate** papers found across multiple sources (arXiv and Semantic Scholar)
4. **Extract** key metadata (title, authors, abstract, citations)

**Available Tools:**
- \`search_arxiv\`: Search arXiv preprints (use for recent papers, preprints, and technical content)
- \`search_semantic_scholar\`: Search Semantic Scholar (use for papers with citation data, venue info, and academic metadata)

**When searching:**
- Use \`search_arxiv\` for preprints, technical papers, and recent research
- Use \`search_semantic_scholar\` for published papers with citation metrics and venue information
- Use both tools and combine results for comprehensive coverage
- Apply appropriate filters (year range, max results, citation counts)
- Prioritize highly-cited and recent papers
- Extract and organize all metadata from results

**After searching:**
- Deduplicate papers that appear in both sources (match by title or DOI)
- Rank papers by relevance and citations
- Provide a summary with:
  - Total unique papers found
  - Date range of papers
  - Top topics/keywords identified
  - Notable highly-cited papers
  - Source distribution (arXiv vs Semantic Scholar)

**Output format:**
Return a structured summary with:
1. Search summary (total papers, date range, sources used)
2. Top papers ranked by relevance (include title, authors, year, citations, source)
3. Key themes identified
4. Recommendations for further search if needed

Always use the tools to get real-time, up-to-date results. Don't rely solely on your training data.
    `)
    .build()
}
