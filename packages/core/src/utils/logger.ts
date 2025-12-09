/**
 * Simple logger utility
 * Can be extended with Winston or Pino later
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private context: string
  private level: LogLevel

  constructor(context: string, level: LogLevel = LogLevel.INFO) {
    this.context = context
    this.level = level
  }

  private log(level: LogLevel, message: string, ...args: unknown[]) {
    if (level < this.level) return

    const timestamp = new Date().toISOString()
    const levelName = LogLevel[level]
    const prefix = `[${timestamp}] [${levelName}] [${this.context}]`

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, ...args)
        break
      case LogLevel.INFO:
        console.log(prefix, message, ...args)
        break
      case LogLevel.WARN:
        console.warn(prefix, message, ...args)
        break
      case LogLevel.ERROR:
        console.error(prefix, message, ...args)
        break
    }
  }

  debug(message: string, ...args: unknown[]) {
    this.log(LogLevel.DEBUG, message, ...args)
  }

  info(message: string, ...args: unknown[]) {
    this.log(LogLevel.INFO, message, ...args)
  }

  warn(message: string, ...args: unknown[]) {
    this.log(LogLevel.WARN, message, ...args)
  }

  error(message: string, ...args: unknown[]) {
    this.log(LogLevel.ERROR, message, ...args)
  }

  child(subContext: string): Logger {
    return new Logger(`${this.context}:${subContext}`, this.level)
  }
}

// Default logger
export const logger = new Logger('ResearchOS')
