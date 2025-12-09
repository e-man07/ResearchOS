/**
 * Base agent class
 */

import { Logger } from '@research-os/core'

export interface AgentConfig {
  name: string
  description: string
  model?: string
}

export abstract class BaseAgent {
  protected logger: Logger
  protected config: AgentConfig

  constructor(config: AgentConfig) {
    this.config = config
    this.logger = new Logger(config.name)
  }

  abstract execute(input: unknown): Promise<unknown>
}
