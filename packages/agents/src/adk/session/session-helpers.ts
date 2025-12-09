/**
 * Helper functions for managing agent sessions
 */

import type { BaseSessionService, Session } from '@iqai/adk'
import { DEFAULT_APP_NAME } from './session-service'

/**
 * Get or create a session for an agent
 * Note: This is a helper - ADK will handle session creation automatically
 * when using withSessionService on AgentBuilder
 */
export async function getOrCreateSession(
  sessionService: BaseSessionService,
  userId: string,
  sessionId?: string,
  appName: string = DEFAULT_APP_NAME
): Promise<Session> {
  // Create new session (or use existing if sessionId provided)
  // ADK will handle session retrieval internally
  return await sessionService.createSession(appName, userId, {}, sessionId)
}

/**
 * Create session options from request
 */
export interface SessionRequestParams {
  userId?: string
  sessionId?: string
  appName?: string
}

export function createSessionOptionsFromRequest(
  req: { body?: SessionRequestParams; query?: SessionRequestParams; headers?: Record<string, string> }
): { userId: string; sessionId?: string; appName: string } | null {
  // Try to get from body, query, or headers (in that order)
  const userId =
    req.body?.userId ||
    req.query?.userId ||
    req.headers?.['x-user-id'] ||
    req.headers?.['user-id']

  if (!userId) {
    return null
  }

  const sessionId =
    req.body?.sessionId ||
    req.query?.sessionId ||
    req.headers?.['x-session-id'] ||
    req.headers?.['session-id']

  const appName =
    req.body?.appName ||
    req.query?.appName ||
    req.headers?.['x-app-name'] ||
    DEFAULT_APP_NAME

  return {
    userId,
    sessionId,
    appName,
  }
}

