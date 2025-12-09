/**
 * Custom error classes for ResearchOS
 */

export class ResearchOSError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ResearchOSError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends ResearchOSError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends ResearchOSError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`
    super(message, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends ResearchOSError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ResearchOSError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403)
    this.name = 'ForbiddenError'
  }
}

export class RateLimitError extends ResearchOSError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, { retryAfter })
    this.name = 'RateLimitError'
  }
}

export class ExternalAPIError extends ResearchOSError {
  constructor(service: string, message: string, details?: unknown) {
    super(`${service} API error: ${message}`, 'EXTERNAL_API_ERROR', 502, details)
    this.name = 'ExternalAPIError'
  }
}

export class QuotaExceededError extends ResearchOSError {
  constructor(quotaType: string) {
    super(`${quotaType} quota exceeded`, 'QUOTA_EXCEEDED', 429)
    this.name = 'QuotaExceededError'
  }
}
