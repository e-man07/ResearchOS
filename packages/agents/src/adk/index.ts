/**
 * ADK-TS Agents and Workflows for ResearchOS
 */

// Agents
export { createPlannerAgent } from './agents/planner'
export type { PlannerAgentOptions } from './agents/planner'

export { createSearchAgent } from './agents/search'
export type { SearchAgentOptions } from './agents/search'

export { createSynthesisAgent } from './agents/synthesis'
export type { SynthesisAgentOptions } from './agents/synthesis'

export { createReportAgent } from './agents/report'
export type { ReportAgentOptions } from './agents/report'

export { createQAAgent } from './agents/qa'
export type { QAAgentOptions } from './agents/qa'

// Tools
export { 
  createSearchArxivTool, 
  createSearchSemanticScholarTool, 
  createRetrieveSimilarTool,
  createMCPTools
} from './tools/mcp-tools'

// Session Management
export {
  createSessionService,
  getDefaultSessionService,
  DEFAULT_APP_NAME,
} from './session/session-service'
export type {
  SessionConfig,
  AgentSessionOptions,
} from './session/session-service'

export {
  getOrCreateSession,
  createSessionOptionsFromRequest,
} from './session/session-helpers'
export type {
  SessionRequestParams,
} from './session/session-helpers'

// Workflows
export { executeLiteratureReview } from './workflows/literature-review'
export type { LiteratureReviewRequest, LiteratureReviewResult } from './workflows/literature-review'

export { executeResearchWorkflow } from './workflows/research-workflow'
export type { ResearchWorkflowRequest, ResearchWorkflowResult } from './workflows/research-workflow'

// Utilities
export {
  getLLMConfig,
  isRateLimitError,
  getModelForAgent,
  createModelGetter,
} from './utils/llm-fallback'
export type { LLMConfig } from './utils/llm-fallback'
