/**
 * Base class for MCP servers
 * Provides common functionality for all connectors
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { RateLimiter, Logger, retry, ExternalAPIError } from '@research-os/core'

export interface MCPServerConfig {
  name: string
  version: string
  rateLimit?: {
    tokensPerInterval: number
    interval: number
  }
}

export abstract class MCPServerBase {
  protected server: McpServer
  protected logger: Logger
  protected rateLimiter?: RateLimiter

  constructor(config: MCPServerConfig) {
    this.server = new McpServer({
      name: config.name,
      version: config.version,
    })

    this.logger = new Logger(config.name)

    if (config.rateLimit) {
      this.rateLimiter = new RateLimiter({
        tokensPerInterval: config.rateLimit.tokensPerInterval,
        interval: config.rateLimit.interval,
      })
    }

    this.registerTools()
  }

  /**
   * Abstract method to register tools
   * Must be implemented by subclasses
   */
  protected abstract registerTools(): void

  /**
   * Execute a rate-limited API call
   */
  protected async executeWithRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    if (this.rateLimiter) {
      await this.rateLimiter.consume()
    }

    return retry(fn, {
      maxAttempts: 3,
      initialDelayMs: 1000,
      onRetry: (error, attempt) => {
        this.logger.warn(`Retrying API call (attempt ${attempt})`, { error: error.message })
      },
    })
  }

  /**
   * Handle API errors consistently
   */
  protected handleAPIError(service: string, error: unknown): never {
    const message = error instanceof Error ? error.message : 'Unknown error'
    this.logger.error(`${service} API error`, { error: message })
    throw new ExternalAPIError(service, message, error)
  }

  /**
   * Get the MCP server instance
   */
  getServer(): McpServer {
    return this.server
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.performHealthCheck()
      return true
    } catch (error) {
      this.logger.error('Health check failed', { error })
      return false
    }
  }

  /**
   * Abstract health check method
   * Can be overridden by subclasses
   */
  protected async performHealthCheck(): Promise<void> {
    // Default implementation - no-op
  }
}
