/**
 * LLM Fallback Utility
 * Provides fallback to Gemini when OpenAI rate limits are hit
 */

export interface LLMConfig {
  primary: string // Primary model (e.g., 'gpt-4o')
  fallback: string // Fallback model (e.g., 'gemini-2.0-flash-exp')
  useFallback: boolean // Whether to use fallback
}

/**
 * Get LLM configuration with fallback support
 */
export function getLLMConfig(): LLMConfig {
  const primaryModel = process.env.LLM_MODEL || process.env.OPENAI_MODEL || 'gpt-4o'
  const fallbackModel = process.env.FALLBACK_LLM_MODEL || process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
  const enableFallback = process.env.ENABLE_LLM_FALLBACK !== 'false' // Default to true

  return {
    primary: primaryModel,
    fallback: fallbackModel,
    useFallback: enableFallback,
  }
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  if (!error) return false
  
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorString = JSON.stringify(error)
  
  return (
    errorMessage.includes('429') ||
    errorMessage.includes('Rate limit') ||
    errorMessage.includes('rate_limit_exceeded') ||
    errorMessage.includes('tokens per min') ||
    errorMessage.includes('TPM') ||
    errorString.includes('429') ||
    errorString.includes('rate_limit')
  )
}

/**
 * Get the appropriate model to use
 * Returns fallback model if forceFallback is true, otherwise returns primary model
 */
export function getModelForAgent(forceFallback = false): string {
  const config = getLLMConfig()
  
  if (forceFallback) {
    return config.fallback
  }
  
  return config.primary
}

/**
 * Create a model getter that can switch to fallback on rate limit errors
 */
export function createModelGetter() {
  let useFallback = false
  
  return {
    getModel: (): string => {
      return getModelForAgent(useFallback)
    },
    setFallback: (value: boolean) => {
      useFallback = value
    },
    shouldUseFallback: (error: unknown): boolean => {
      if (isRateLimitError(error)) {
        useFallback = true
        return true
      }
      return false
    },
    reset: () => {
      useFallback = false
    },
  }
}

