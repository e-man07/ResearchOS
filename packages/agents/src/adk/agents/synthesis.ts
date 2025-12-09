/**
 * Synthesis Agent - Analyzes and synthesizes research findings
 * Can optionally use RAG retrieval tool to find additional context
 */

import { AgentBuilder, type BaseSessionService } from '@iqai/adk'
import { createRetrieveSimilarTool } from '../tools/mcp-tools'
import type { RAGPipeline } from '@research-os/rag'
import type { AgentSessionOptions } from '../session/session-service'
import { getModelForAgent } from '../utils/llm-fallback'
import * as dotenv from 'dotenv'

dotenv.config()

export interface SynthesisAgentOptions {
  ragPipeline?: RAGPipeline
  sessionService?: BaseSessionService
  sessionOptions?: AgentSessionOptions
}

/**
 * Create Synthesis agent with optional RAG tool support
 * @param options - Configuration options including RAG pipeline and session service
 */
export async function createSynthesisAgent(options?: SynthesisAgentOptions, useFallback = false) {
  const { ragPipeline, sessionService, sessionOptions } = options || {}
  const tools = []
  
  // Add RAG retrieval tool if pipeline is provided for finding additional context
  if (ragPipeline) {
    const retrieveTool = createRetrieveSimilarTool(ragPipeline)
    tools.push(retrieveTool)
  }

  const builder = AgentBuilder.create('research_synthesis')
    .withModel(getModelForAgent(useFallback))
    .withDescription('Analyzes and synthesizes research papers into insights')
  
  if (tools.length > 0) {
    builder.withTools(...tools)
  }

  // Add session service if provided
  if (sessionService && sessionOptions) {
    builder.withSessionService(sessionService, {
      userId: sessionOptions.userId,
      appName: sessionOptions.appName || 'research-os',
      sessionId: sessionOptions.sessionId,
    })
  }

  return await builder
    .withInstruction(`
You are a Research Synthesis Agent. Your role is to:

1. **Analyze** research papers for key findings and methodologies
2. **Identify** common themes, trends, and patterns
3. **Compare** different approaches and results
4. **Synthesize** insights across multiple papers
5. **Detect** research gaps and future directions

${ragPipeline ? `
**Available Tool:**
- \`retrieve_similar\`: Use this to find additional relevant content from indexed papers when you need more context about specific topics, methodologies, or findings mentioned in the papers you're analyzing.
` : ''}

**When analyzing papers:**
- Extract main contributions and novel ideas
- Identify methodologies and experimental setups
- Note limitations and criticisms
- Find connections between different works
- Highlight contradictions or debates
- ${ragPipeline ? 'Use the retrieval tool if you need additional context on specific topics or want to verify claims against a broader corpus.' : ''}

**Analysis Process:**
1. Review all provided papers and extract key information
2. Identify recurring themes and patterns
3. Compare methodologies and findings across papers
4. Look for contradictions, debates, or conflicting results
5. Identify gaps where more research is needed
6. Synthesize insights into coherent findings

**Output structured analysis:**
{
  "key_themes": ["theme1", "theme2", ...],
  "main_findings": [
    {
      "finding": "description",
      "papers": ["paper_id1", "paper_id2"],
      "confidence": "high/medium/low",
      "evidence": "specific evidence from papers"
    }
  ],
  "trends": {
    "emerging": ["trend1", ...],
    "declining": ["trend2", ...],
    "stable": ["trend3", ...]
  },
  "research_gaps": [
    {
      "gap": "description",
      "importance": "why this gap matters",
      "suggested_direction": "potential research direction"
    }
  ],
  "contradictions": [
    {
      "topic": "...",
      "viewpoints": [
        {
          "position": "...",
          "papers": ["paper_id1"],
          "evidence": "..."
        }
      ]
    }
  ],
  "methodologies": {
    "common_approaches": ["approach1", ...],
    "innovative_methods": ["method1", ...]
  }
}

Be objective and evidence-based. Cite specific papers for claims. Use the retrieval tool strategically to enhance your analysis with additional context when needed.
    `)
    .build()
}
