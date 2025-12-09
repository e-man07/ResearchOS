/**
 * ADK-TS Agents and Workflows for ResearchOS
 */

// Agents
export { createPlannerAgent } from './agents/planner.js'
export type { PlannerAgentOptions } from './agents/planner.js'

export { createSearchAgent } from './agents/search.js'
export type { SearchAgentOptions } from './agents/search.js'

export { createSynthesisAgent } from './agents/synthesis.js'
export type { SynthesisAgentOptions } from './agents/synthesis.js'

export { createReportAgent } from './agents/report.js'
export type { ReportAgentOptions } from './agents/report.js'

export { createQAAgent } from './agents/qa.js'
export type { QAAgentOptions } from './agents/qa.js'

// Tools
export { 
  createSearchArxivTool, 
  createSearchSemanticScholarTool, 
  createRetrieveSimilarTool,
  createMCPTools
} from './tools/mcp-tools.js'

// Session Management
export {
  createSessionService,
  getDefaultSessionService,
  DEFAULT_APP_NAME,
} from './session/session-service.js'
export type {
  SessionConfig,
  AgentSessionOptions,
} from './session/session-service.js'

export {
  getOrCreateSession,
  createSessionOptionsFromRequest,
} from './session/session-helpers.js'
export type {
  SessionRequestParams,
} from './session/session-helpers.js'

// Workflows
export { executeLiteratureReview } from './workflows/literature-review.js'
export type { LiteratureReviewRequest, LiteratureReviewResult } from './workflows/literature-review.js'

export { executeResearchWorkflow } from './workflows/research-workflow.js'
export type { ResearchWorkflowRequest, ResearchWorkflowResult } from './workflows/research-workflow.js'

// Utilities
export {
  getLLMConfig,
  isRateLimitError,
  getModelForAgent,
  createModelGetter,
} from './utils/llm-fallback.js'
export type { LLMConfig } from './utils/llm-fallback.js'
