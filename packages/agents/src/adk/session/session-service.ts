/**
 * Session Service Configuration for ADK-TS Agents
 * Provides persistent conversation memory across agent interactions
 */

import {
  BaseSessionService,
  InMemorySessionService,
  createDatabaseSessionService,
  createSqliteSessionService,
} from '@iqai/adk'
import * as dotenv from 'dotenv'

dotenv.config()

export interface SessionConfig {
  type: 'memory' | 'sqlite' | 'postgres' | 'mysql' | 'database'
  connectionString?: string
  dbPath?: string // For SQLite
  tableName?: string
}

/**
 * Create a session service based on configuration
 */
export function createSessionService(config?: SessionConfig): BaseSessionService {
  const sessionType = config?.type || process.env.SESSION_TYPE || 'memory'

  switch (sessionType) {
    case 'memory':
      return new InMemorySessionService()

    case 'sqlite':
      return createSqliteSessionService(
        config?.dbPath || process.env.SESSION_DB_PATH || './sessions.db'
      )

    case 'postgres':
      return createDatabaseSessionService(
        config?.connectionString ||
          process.env.DATABASE_URL ||
          process.env.POSTGRES_CONNECTION_STRING ||
          ''
      )

    case 'mysql':
      // Note: MySQL requires a separate import/implementation in ADK
      // For now, fall back to database with MySQL connection string
      return createDatabaseSessionService(
        config?.connectionString ||
          process.env.DATABASE_URL ||
          process.env.MYSQL_CONNECTION_STRING ||
          ''
      )

    case 'database':
      return createDatabaseSessionService(
        config?.connectionString ||
          process.env.DATABASE_URL ||
          ''
      )

    default:
      console.warn(`Unknown session type: ${sessionType}, falling back to in-memory`)
      return new InMemorySessionService()
  }
}

/**
 * Get the default session service instance
 * Creates a singleton instance that can be reused across agents
 */
let defaultSessionService: BaseSessionService | null = null

export function getDefaultSessionService(): BaseSessionService {
  if (!defaultSessionService) {
    defaultSessionService = createSessionService()
  }
  return defaultSessionService
}

/**
 * Session options for agent configuration
 */
export interface AgentSessionOptions {
  userId: string
  appName?: string
  sessionId?: string
}

/**
 * Default app name for ResearchOS
 */
export const DEFAULT_APP_NAME = 'research-os'

