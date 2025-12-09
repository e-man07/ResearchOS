/**
 * Token bucket rate limiter
 * Useful for respecting API rate limits
 */

export interface RateLimiterOptions {
  tokensPerInterval: number
  interval: number // in milliseconds
  maxTokens?: number
}

export class RateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly tokensPerInterval: number
  private readonly interval: number
  private readonly maxTokens: number

  constructor(options: RateLimiterOptions) {
    this.tokensPerInterval = options.tokensPerInterval
    this.interval = options.interval
    this.maxTokens = options.maxTokens ?? options.tokensPerInterval
    this.tokens = this.maxTokens
    this.lastRefill = Date.now()
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    const intervalsElapsed = elapsed / this.interval

    if (intervalsElapsed >= 1) {
      const tokensToAdd = Math.floor(intervalsElapsed * this.tokensPerInterval)
      this.tokens = Math.min(this.tokens + tokensToAdd, this.maxTokens)
      this.lastRefill = now
    }
  }

  /**
   * Try to consume tokens
   * Returns true if successful, false if not enough tokens
   */
  tryConsume(tokens: number = 1): boolean {
    this.refill()

    if (this.tokens >= tokens) {
      this.tokens -= tokens
      return true
    }

    return false
  }

  /**
   * Wait until tokens are available and consume them
   */
  async consume(tokens: number = 1): Promise<void> {
    while (!this.tryConsume(tokens)) {
      // Calculate wait time
      const tokensNeeded = tokens - this.tokens
      const intervalsNeeded = Math.ceil(tokensNeeded / this.tokensPerInterval)
      const waitTime = intervalsNeeded * this.interval

      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }
  }

  /**
   * Get current token count
   */
  getTokens(): number {
    this.refill()
    return this.tokens
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.tokens = this.maxTokens
    this.lastRefill = Date.now()
  }
}
