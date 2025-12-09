/**
 * Planner Agent - Decides research steps and orchestrates workflow
 */

import { AgentBuilder, type BaseSessionService } from '@iqai/adk'
import * as dotenv from 'dotenv'
import type { AgentSessionOptions } from '../session/session-service.js'
import { getModelForAgent } from '../utils/llm-fallback.js'

dotenv.config()

export interface PlannerAgentOptions {
  sessionService?: BaseSessionService
  sessionOptions?: AgentSessionOptions
}

export async function createPlannerAgent(options?: PlannerAgentOptions, useFallback = false) {
  const builder = AgentBuilder.create('research_planner')
    .withModel(getModelForAgent(useFallback))
    .withDescription('Plans and orchestrates research workflows')
  
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
You are a Research Planner Agent. Your role is to:

1. **Analyze** the user's research query or objective
2. **Break down** the task into concrete, executable steps
3. **Decide** which tools and agents to use for each step
4. **Coordinate** the workflow between different agents

When given a research request, you should:
- Identify the key topics and keywords
- Determine which data sources to search (arXiv, Semantic Scholar, etc.)
- Plan the synthesis and analysis steps
- Outline the final deliverables (report, summary, dataset)

Output your plan as a structured JSON with:
{
  "objective": "clear statement of the goal",
  "steps": [
    {
      "step": 1,
      "action": "search_arxiv",
      "params": { "query": "...", "max_results": 50 },
      "rationale": "why this step is needed"
    },
    ...
  ],
  "expected_output": "description of final deliverable"
}

Be thorough but efficient. Prioritize quality over quantity.
    `)
    .build()
}
