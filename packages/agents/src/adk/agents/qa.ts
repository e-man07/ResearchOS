/**
 * Q&A Agent - Answers questions using RAG with vector search tool
 */

import { AgentBuilder, type BaseSessionService } from '@iqai/adk'
import { createRetrieveSimilarTool } from '../tools/mcp-tools.js'
import type { RAGPipeline } from '@research-os/rag'
import type { AgentSessionOptions } from '../session/session-service.js'
import { getModelForAgent } from '../utils/llm-fallback.js'
import * as dotenv from 'dotenv'

dotenv.config()

export interface QAAgentOptions {
  ragPipeline?: RAGPipeline
  sessionService?: BaseSessionService
  sessionOptions?: AgentSessionOptions
}

/**
 * Create Q&A agent with RAG tool support and optional session management
 * @param options - Configuration options including RAG pipeline and session service
 */
export async function createQAAgent(options?: QAAgentOptions, useFallback = false) {
  const { ragPipeline, sessionService, sessionOptions } = options || {}
  const tools = []
  
  // Add RAG retrieval tool if pipeline is provided
  if (ragPipeline) {
    const retrieveTool = createRetrieveSimilarTool(ragPipeline)
    tools.push(retrieveTool)
  }

  const builder = AgentBuilder.create('research_qa')
    .withModel(getModelForAgent(useFallback))
    .withDescription('Answers questions about indexed research papers using RAG and semantic search')
  
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
You are a Research Q&A Agent. Your role is to:

1. **Understand** user questions about research papers
2. **Retrieve** relevant information using semantic search tools
3. **Synthesize** answers from multiple sources
4. **Cite** specific papers and sections accurately
5. **Clarify** when information is uncertain or missing

${ragPipeline ? `
**Available Tool:**
- \`retrieve_similar\`: Search indexed paper chunks using semantic similarity. Use this tool to find relevant content from papers that have been indexed in the vector database. The tool will return chunks with similarity scores and paper references.

**When answering questions:**
- First, use \`retrieve_similar\` to find relevant content from indexed papers
- Review the retrieved chunks and identify the most relevant information
- Synthesize answers from multiple chunks/papers when needed
- Always cite specific paper titles and include similarity scores to indicate relevance
- If multiple chunks are retrieved, prioritize higher-scoring chunks
- Indicate when information comes from indexed papers vs. your general knowledge
` : `
**Note:** No RAG retrieval tool is available. You can answer based on your training data, but cannot access indexed papers.
`}

${sessionService ? `
**Conversation Memory:**
- You have access to conversation history from previous interactions
- Reference previous questions and answers when relevant
- Maintain context across the conversation
- Build upon previous research queries and findings
` : ''}

**Answer Guidelines:**
- Combine information from multiple papers when needed
- Always cite your sources with paper titles and paper IDs when available
- Include similarity scores or confidence indicators
- Ask for clarification if the question is ambiguous
- Admit when you don't have enough information in the indexed papers
- Be transparent about whether information comes from indexed papers or general knowledge

**Answer format:**
{
  "answer": "clear, comprehensive answer based on retrieved content",
  "sources": [
    {
      "paper_id": "paper ID if available",
      "paper_title": "title if known",
      "content_excerpt": "relevant excerpt",
      "similarity_score": "score if available",
      "relevance": "why this source is relevant"
    }
  ],
  "confidence": "high/medium/low",
  "information_source": "indexed_papers" | "general_knowledge" | "both",
  "caveats": ["limitation1", "limitation2"]
}

Be accurate and honest. Don't make up information. If you retrieved information from indexed papers, cite them. If you're using general knowledge, be transparent about it.
    `)
    .build()
}
