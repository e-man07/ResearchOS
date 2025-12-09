/**
 * Conversation Tone Manager
 * Manages tone adaptation based on conversation context for natural, empathetic responses.
 * 
 * Requirements: 3.2, 4.1, 4.2
 */

export interface ConversationContext {
  messageCount: number
  userTone: 'casual' | 'formal' | 'technical'
  lastUserSentiment: 'positive' | 'neutral' | 'frustrated' | 'confused'
  isReturningUser: boolean
}

export interface ToneSettings {
  formality: number  // 0-1, lower = more casual
  enthusiasm: number // 0-1, higher = more expressive
  empathy: number    // 0-1, higher for frustrated/confused users
}

export interface UserInputAnalysis {
  tone: 'casual' | 'formal' | 'technical'
  sentiment: 'positive' | 'neutral' | 'frustrated' | 'confused'
}

// Sentiment markers for detection
const FRUSTRATION_MARKERS = [
  'frustrated', 'frustrating', 'annoying', 'annoyed', 'angry',
  'not working', "doesn't work", "won't work", 'broken', 'useless',
  'terrible', 'awful', 'hate', 'stupid', 'ridiculous', 'impossible',
  'give up', 'giving up', 'fed up', 'sick of', 'tired of'
]

const CONFUSION_MARKERS = [
  'confused', 'confusing', "don't understand", "doesn't make sense",
  "can't figure", 'unclear', 'lost', 'stuck', 'help me understand',
  'what do you mean', 'i\'m not sure', 'not sure what', 'how do i',
  'what is', 'explain', 'clarify'
]

const POSITIVE_MARKERS = [
  'thanks', 'thank you', 'great', 'awesome', 'perfect', 'excellent',
  'amazing', 'wonderful', 'love', 'helpful', 'appreciate', 'cool',
  'nice', 'good', 'fantastic', 'brilliant'
]

const TECHNICAL_MARKERS = [
  'algorithm', 'implementation', 'architecture', 'framework', 'api',
  'database', 'query', 'function', 'method', 'class', 'interface',
  'parameter', 'variable', 'syntax', 'compile', 'runtime', 'debug',
  'optimization', 'performance', 'latency', 'throughput', 'scalability'
]

const FORMAL_MARKERS = [
  'would you please', 'could you kindly', 'i would like to',
  'i am interested in', 'please provide', 'i require',
  'furthermore', 'therefore', 'consequently', 'regarding'
]

/**
 * ConversationToneManager handles sentiment detection and tone adaptation
 * to create natural, empathetic responses.
 */
export class ConversationToneManager {
  /**
   * Analyzes user input to detect tone and sentiment.
   * 
   * @param input - The user's message text
   * @returns Analysis containing detected tone and sentiment
   */
  analyzeUserInput(input: string): UserInputAnalysis {
    const lower = input.toLowerCase()
    
    // Detect sentiment
    const sentiment = this.detectSentiment(lower)
    
    // Detect tone
    const tone = this.detectTone(lower)
    
    return { tone, sentiment }
  }

  /**
   * Detects the sentiment of user input.
   */
  private detectSentiment(lower: string): 'positive' | 'neutral' | 'frustrated' | 'confused' {
    // Check for frustration first (highest priority for empathy)
    if (FRUSTRATION_MARKERS.some(marker => lower.includes(marker))) {
      return 'frustrated'
    }
    
    // Check for confusion
    if (CONFUSION_MARKERS.some(marker => lower.includes(marker))) {
      return 'confused'
    }
    
    // Check for positive sentiment
    if (POSITIVE_MARKERS.some(marker => lower.includes(marker))) {
      return 'positive'
    }
    
    return 'neutral'
  }

  /**
   * Detects the tone of user input.
   */
  private detectTone(lower: string): 'casual' | 'formal' | 'technical' {
    // Check for technical language
    const technicalCount = TECHNICAL_MARKERS.filter(marker => lower.includes(marker)).length
    if (technicalCount >= 2) {
      return 'technical'
    }
    
    // Check for formal language
    if (FORMAL_MARKERS.some(marker => lower.includes(marker))) {
      return 'formal'
    }
    
    // Check input length and structure for formality hints
    const words = lower.split(/\s+/).filter(w => w.length > 0)
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (words.length || 1)
    
    // Longer average word length and longer messages tend to be more formal
    if (avgWordLength > 6 && words.length > 15) {
      return 'formal'
    }
    
    return 'casual'
  }

  /**
   * Calculates tone settings based on conversation context.
   * These settings guide response generation for appropriate tone matching.
   * 
   * @param context - The current conversation context
   * @returns ToneSettings for response generation
   */
  calculateToneSettings(context: ConversationContext): ToneSettings {
    let formality = 0.5  // Default middle ground
    let enthusiasm = 0.5
    let empathy = 0.3    // Base empathy level
    
    // Adjust formality based on user tone
    switch (context.userTone) {
      case 'casual':
        formality = 0.2
        enthusiasm = 0.7
        break
      case 'formal':
        formality = 0.8
        enthusiasm = 0.4
        break
      case 'technical':
        formality = 0.6
        enthusiasm = 0.5
        break
    }
    
    // Adjust empathy based on sentiment
    switch (context.lastUserSentiment) {
      case 'frustrated':
        empathy = 1.0
        enthusiasm = 0.3  // Tone down enthusiasm when user is frustrated
        break
      case 'confused':
        empathy = 0.8
        enthusiasm = 0.4
        break
      case 'positive':
        empathy = 0.4
        enthusiasm = 0.8  // Match positive energy
        break
      case 'neutral':
        empathy = 0.3
        break
    }
    
    // Build rapport over time - become more casual as conversation progresses
    if (context.messageCount > 5) {
      formality = Math.max(0.1, formality - 0.2)
      enthusiasm = Math.min(0.9, enthusiasm + 0.1)
    }
    
    // Returning users get warmer treatment
    if (context.isReturningUser) {
      formality = Math.max(0.1, formality - 0.1)
      enthusiasm = Math.min(0.9, enthusiasm + 0.1)
    }
    
    return {
      formality: Math.max(0, Math.min(1, formality)),
      enthusiasm: Math.max(0, Math.min(1, enthusiasm)),
      empathy: Math.max(0, Math.min(1, empathy))
    }
  }

  /**
   * Determines if a response should include empathetic language
   * based on detected negative sentiment.
   * 
   * @param sentiment - The detected user sentiment
   * @returns true if empathetic response is needed
   */
  needsEmpatheticResponse(sentiment: 'positive' | 'neutral' | 'frustrated' | 'confused'): boolean {
    return sentiment === 'frustrated' || sentiment === 'confused'
  }

  /**
   * Gets empathetic phrases appropriate for the sentiment.
   * 
   * @param sentiment - The detected user sentiment
   * @returns Array of empathetic phrases to use
   */
  getEmpatheticPhrases(sentiment: 'frustrated' | 'confused'): string[] {
    if (sentiment === 'frustrated') {
      return [
        "I understand this can be frustrating",
        "I hear you, let me help",
        "No worries, we'll figure this out together",
        "I get it, that's annoying",
        "Let me see what I can do to help"
      ]
    }
    
    return [
      "I understand, let me clarify",
      "No problem, I'll explain",
      "Let me help clear that up",
      "Good question, here's what I mean",
      "I can see how that might be confusing"
    ]
  }
}

// Export singleton instance for convenience
export const conversationToneManager = new ConversationToneManager()

// Export markers for testing
export const sentimentMarkers = {
  frustration: FRUSTRATION_MARKERS,
  confusion: CONFUSION_MARKERS,
  positive: POSITIVE_MARKERS
}

export const toneMarkers = {
  technical: TECHNICAL_MARKERS,
  formal: FORMAL_MARKERS
}
