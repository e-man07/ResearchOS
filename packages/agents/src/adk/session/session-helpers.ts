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

/**
 * Helper to extract string value from header (handles string | string[] | undefined)
 */
function getHeaderValue(
  headers: Record<string, string | string[] | undefined> | undefined,
  key: string
): string | undefined {
  if (!headers) return undefined
  const value = headers[key]
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0]
  return undefined
}

export function createSessionOptionsFromRequest(
  req: {
    body?: SessionRequestParams
    query?: SessionRequestParams | Record<string, string | string[] | undefined>
    headers?: Record<string, string | string[] | undefined>
  }
): { userId: string; sessionId?: string; appName: string } | null {
  // Try to get from body, query, or headers (in that order)
  const userId =
    req.body?.userId ||
    (typeof req.query?.userId === 'string' ? req.query.userId : undefined) ||
    getHeaderValue(req.headers, 'x-user-id') ||
    getHeaderValue(req.headers, 'user-id')

  if (!userId) {
    return null
  }

  const sessionId =
    req.body?.sessionId ||
    (typeof req.query?.sessionId === 'string' ? req.query.sessionId : undefined) ||
    getHeaderValue(req.headers, 'x-session-id') ||
    getHeaderValue(req.headers, 'session-id')

  const appName =
    req.body?.appName ||
    (typeof req.query?.appName === 'string' ? req.query.appName : undefined) ||
    getHeaderValue(req.headers, 'x-app-name') ||
    DEFAULT_APP_NAME

  return {
    userId,
    sessionId,
    appName,
  }
}

