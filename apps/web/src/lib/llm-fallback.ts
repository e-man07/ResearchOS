/**
 * LLM Fallback Utility for Web App
 * Provides fallback to Gemini when OpenAI rate limits are hit
 */

import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface LLMConfig {
  primary: string // Primary model (e.g., 'gpt-4o')
  fallback: string // Fallback model (e.g., 'gemini-2.0-flash-exp')
  useFallback: boolean // Whether to use fallback
}

/**
 * Get LLM configuration with fallback support
 */
function getLLMConfig(): LLMConfig {
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
function isRateLimitError(error: unknown): boolean {
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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize Gemini client if API key is available
let geminiClient: GoogleGenerativeAI | null = null
if (process.env.GOOGLE_API_KEY) {
  geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMCompletionOptions {
  model?: string
  temperature?: number
  max_tokens?: number
}

/**
 * Convert OpenAI messages format to Gemini chat history format
 * Gemini uses a chat history with alternating user/assistant messages
 */
function convertMessagesToGeminiFormat(messages: ChatMessage[]): { 
  history: Array<{ role: 'user' | 'model', parts: string[] }>, 
  currentMessage: string,
  systemInstruction?: string 
} {
  // Extract system prompt if present
  const systemMessage = messages.find(m => m.role === 'system')
  const conversationMessages = messages.filter(m => m.role !== 'system')
  
  const history: Array<{ role: 'user' | 'model', parts: string[] }> = []
  let currentMessage = ''
  let systemInstruction: string | undefined = undefined
  
  if (systemMessage) {
    systemInstruction = systemMessage.content
  }
  
  // Build chat history (excluding the last user message which will be the current prompt)
  for (let i = 0; i < conversationMessages.length - 1; i++) {
    const msg = conversationMessages[i]
    if (msg.role === 'user') {
      history.push({
        role: 'user',
        parts: [msg.content],
      })
    } else if (msg.role === 'assistant') {
      history.push({
        role: 'model',
        parts: [msg.content],
      })
    }
  }
  
  // Last message is the current prompt
  const lastMessage = conversationMessages[conversationMessages.length - 1]
  if (lastMessage && lastMessage.role === 'user') {
    currentMessage = lastMessage.content
  } else {
    // If last message is not user, use it as current message anyway
    currentMessage = lastMessage?.content || ''
  }
  
  return { history, currentMessage, systemInstruction }
}

/**
 * Generate completion using OpenAI
 */
async function generateWithOpenAI(
  messages: ChatMessage[],
  options: LLMCompletionOptions = {}
): Promise<string> {
  const model = options.model || process.env.LLM_MODEL || 'gpt-4o'
  const temperature = options.temperature ?? 0.8
  const max_tokens = options.max_tokens ?? 2000

  const completion = await openai.chat.completions.create({
    model,
    messages: messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
      content: msg.content,
    })),
    temperature,
    max_tokens,
  })

  return completion.choices[0].message.content || 'No response generated'
}

/**
 * Generate completion using Gemini
 */
async function generateWithGemini(
  messages: ChatMessage[],
  options: LLMCompletionOptions = {}
): Promise<string> {
  if (!geminiClient) {
    throw new Error('Gemini API key not configured. Set GOOGLE_API_KEY environment variable.')
  }

  const config = getLLMConfig()
  const modelName = options.model || config.fallback || 'gemini-2.0-flash-exp'
  const temperature = options.temperature ?? 0.8
  const maxOutputTokens = options.max_tokens ?? 2000

  // Convert messages to Gemini format
  const { history, currentMessage, systemInstruction } = convertMessagesToGeminiFormat(messages)

  // Get the model with system instruction if available
  const modelConfig: any = {
    model: modelName,
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  }

  if (systemInstruction) {
    modelConfig.systemInstruction = {
      parts: [{ text: systemInstruction }],
    }
  }

  const model = geminiClient.getGenerativeModel(modelConfig)

  // Start a chat session with history if available
  if (history.length > 0) {
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: h.parts.map(p => ({ text: p })),
      })),
    })
    const result = await chat.sendMessage(currentMessage)
    const response = result.response
    const text = response.text()
    return text || 'No response generated'
  } else {
    // No history, just generate content
    const result = await model.generateContent(currentMessage)
    const response = result.response
    const text = response.text()
    return text || 'No response generated'
  }
}

/**
 * Generate completion with automatic fallback to Gemini on rate limit errors
 */
export async function generateWithFallback(
  messages: ChatMessage[],
  options: LLMCompletionOptions = {}
): Promise<{ content: string; model: string; usedFallback: boolean }> {
  const config = getLLMConfig()
  
  // If fallback is disabled, just use OpenAI
  if (!config.useFallback) {
    const content = await generateWithOpenAI(messages, options)
    return {
      content,
      model: options.model || config.primary,
      usedFallback: false,
    }
  }

  try {
    // Try OpenAI first
    const content = await generateWithOpenAI(messages, options)
    return {
      content,
      model: options.model || config.primary,
      usedFallback: false,
    }
  } catch (error) {
    // Check if it's a rate limit error
    if (isRateLimitError(error)) {
      console.warn('⚠️  OpenAI rate limit detected, switching to Gemini fallback...')
      
      if (!geminiClient) {
        // If Gemini is not configured, throw the original error
        throw new Error(
          'OpenAI rate limit exceeded and Gemini fallback is not configured. ' +
          'Please set GOOGLE_API_KEY environment variable to enable fallback.'
        )
      }

      try {
        const content = await generateWithGemini(messages, options)
        return {
          content,
          model: config.fallback,
          usedFallback: true,
        }
      } catch (geminiError) {
        console.error('❌ Gemini fallback also failed:', geminiError)
        // If Gemini also fails, throw the original OpenAI error
        throw error
      }
    }
    
    // If it's not a rate limit error, throw it as-is
    throw error
  }
}

