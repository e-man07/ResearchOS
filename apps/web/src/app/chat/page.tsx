'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Sparkles, FileText, Search, Bot, User, MessageSquare, History, X, Menu, ChevronDown, LayoutDashboard, LogOut, Settings, Plus, Lightbulb, Download, Database, ChevronLeft, ChevronRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { CommandHints } from '@/components/chat/CommandHints'
import { QuickActions } from '@/components/chat/QuickActions'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  type?: 'workflow' | 'search' | 'question' | 'index' | 'general'
  metadata?: any
}

interface SearchResult {
  papers: any[]
  searchId: string
  totalResults: number
}

export default function ChatPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false) // Hidden on mobile by default
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Collapsed state for desktop
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [showCommandHints, setShowCommandHints] = useState(false)
  const [workflowProgress, setWorkflowProgress] = useState<{ agent?: string; message?: string } | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false) // Track if welcome message has been initialized
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileMenuOpen])

  // Redirect if not authenticated
  useEffect(() => {
    if (session === null) {
      router.push('/auth/signin')
    }
  }, [session, router])

  // Initialize with welcome message (only on initial mount, not when manually reset)
  useEffect(() => {
    if (session && messages.length === 0 && !hasInitialized && !sessionId) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Hey there! 👋 I'm your research buddy - think of me as your friendly AI assistant who's genuinely excited to help you dive into the world of academic research!

## What I can do:

🔍 **Search for Papers** - Just ask me to find papers on any topic
   - "Search for papers about transformer architectures"
   - "Find research on quantum computing"
   - "Look for papers on attention mechanisms"

🚀 **Research Workflows** - I'll run full research workflows with multiple agents
   - "Research attention mechanisms in transformers"
   - "Analyze recent papers on large language models"
   - "Do a full research workflow on neural architecture search"

❓ **Ask Questions** - Ask questions about papers I've found or indexed
   - "What are the main findings?"
   - "Summarize the key methodologies"
   - "Compare the different approaches"

📚 **Index Papers** - I can help you index papers for better search
   - "Index these papers"
   - "Add these to the knowledge base"

**Try saying:**
- "Search for papers about GPT-4"
- "Research transformer architectures"
- "Find papers on reinforcement learning"

What would you like to explore today?`,
        timestamp: new Date(),
        type: 'general',
      }
      setMessages([welcomeMessage])
      setHasInitialized(true)
    }
  }, [session, messages.length, hasInitialized, sessionId])

  const detectIntent = (text: string, currentSessionId: string | null = null): 'workflow' | 'search' | 'question' | 'index' | 'general' => {
    const lower = text.toLowerCase().trim()
    
    // If we have a sessionId, prioritize question intent for follow-ups
    // This helps catch follow-up questions that might not have explicit question words
    const hasActiveSession = currentSessionId !== null
    
    // Skip greetings and short responses
    const greetings = ['hey', 'hello', 'hi', 'thanks', 'thank you', 'ok', 'okay', 'yes', 'no']
    if (greetings.some(g => lower === g || lower.startsWith(g + ' '))) {
      return 'general'
    }
    
    // Explicit search keywords
    if (
      lower.includes('search for') ||
      lower.includes('find papers') ||
      lower.includes('look for papers') ||
      lower.includes('find research') ||
      lower.match(/^(search|find|look for)/i)
    ) {
      return 'search'
    }
    
    // Research/workflow keywords (explicit)
    if (
      lower.includes('research') ||
      lower.includes('analyze') ||
      lower.includes('explore') ||
      lower.includes('workflow') ||
      lower.match(/^(research|analyze|explore|do a|run)/i)
    ) {
      return 'workflow'
    }
    
    // Indexing keywords
    if (
      lower.includes('index') ||
      lower.includes('add papers') ||
      lower.includes('store papers')
    ) {
      return 'index'
    }
    
    // Question keywords (expanded to catch more follow-up questions)
    if (
      lower.includes('what') ||
      lower.includes('how') ||
      lower.includes('why') ||
      lower.includes('when') ||
      lower.includes('where') ||
      lower.includes('who') ||
      lower.includes('which') ||
      lower.includes('explain') ||
      lower.includes('tell me') ||
      lower.includes('show me') ||
      lower.includes('list') ||
      lower.includes('summarize') ||
      lower.includes('compare') ||
      lower.includes('describe') ||
      lower.includes('?') ||
      lower.includes('about the') ||
      lower.includes('about these') ||
      lower.includes('about this') ||
      lower.includes('from the') ||
      lower.includes('in the') ||
      lower.includes('of the') ||
      lower.includes('that you') ||
      lower.includes('you used') ||
      lower.includes('you found') ||
      lower.includes('you mentioned')
    ) {
      return 'question'
    }
    
    // If we have an active session and the message seems like a follow-up, treat as question
    if (hasActiveSession) {
      // Follow-up indicators when there's an active session
      const followUpIndicators = [
        'papers', 'report', 'findings', 'results', 'analysis', 'summary',
        'method', 'approach', 'conclusion', 'details', 'more', 'again'
      ]
      if (followUpIndicators.some(indicator => lower.includes(indicator))) {
        return 'question'
      }
    }
    
    // If it looks like a research topic (2+ words, no question mark)
    const words = lower.split(/\s+/).filter(w => w.length > 0)
    if (words.length >= 2 && !lower.includes('?')) {
      const researchIndicators = [
        'model', 'algorithm', 'method', 'approach', 'technique', 'system',
        'framework', 'architecture', 'mechanism', 'network', 'learning',
        'computing', 'processing', 'analysis', 'optimization', 'theory'
      ]
      if (researchIndicators.some(indicator => lower.includes(indicator))) {
        return 'workflow'
      }
      // Default to search for topic phrases
      if (words.length >= 2 && words.length <= 4) {
        return 'search'
      }
    }
    
    return 'general'
  }

  const extractSearchQuery = (text: string): string => {
    // Remove command words
    return text
      .replace(/^(search for|find papers|look for papers|find research|search|find|look for)\s+/i, '')
      .replace(/\s+(papers|research|studies|publications)$/i, '')
      .trim()
  }

  const extractWorkflowQuery = (text: string): string => {
    // Remove command words
    return text
      .replace(/^(research|analyze|explore|do a|run|workflow on|research on)\s+/i, '')
      .replace(/\s+(workflow|analysis|research)$/i, '')
      .trim()
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !session) return

    const userMessageText = input.trim()
    setInput('')
    setIsLoading(true)

    const intent = detectIntent(userMessageText, sessionId)

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessageText,
      timestamp: new Date(),
      type: intent,
    }

    setMessages((prev) => [...prev, userMessage])

    // Add loading message
    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      type: intent,
    }
    setMessages((prev) => [...prev, loadingMessage])

    try {
      let response: Response
      let responseData: any

      // Route based on intent
      if (intent === 'search') {
        // Extract search query
        const queryText = extractSearchQuery(userMessageText)
        
        if (!queryText) {
          throw new Error('I\'d love to help you search! Could you tell me what topic you\'re interested in?')
        }
        
        // Update loading message
        setMessages((prev) => prev.map(m => 
          m.id === loadingMessage.id 
            ? { ...m, content: `🔍 Searching for papers about "${queryText}"...\n\nLet me see what I can find for you!` }
            : m
        ))
        
        // Search papers
        response = await fetch('/api/v1/papers/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: queryText,
            sources: ['arxiv', 'semantic_scholar'],
            maxResults: 20,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Search failed')
        }

        responseData = await response.json()
        const papers = responseData.papers || []
        const searchId = responseData.searchId

        // Store search results
        setSearchResults({ papers, searchId, totalResults: papers.length })

        // Check for existing chat session
        if (searchId) {
          try {
            const sessionResponse = await fetch(`/api/v1/chat/sessions?searchId=${searchId}`)
            if (sessionResponse.ok) {
              const session = await sessionResponse.json()
              setSessionId(session.id)
            }
          } catch (e) {
            // No existing session, that's okay
          }
        }

        // Format response
        const searchResponse: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: `Nice! 🎉 I found **${papers.length} papers** about "${queryText}". 

Here are the top results that caught my attention:

${papers.slice(0, 5).map((p: any, i: number) => {
            const title = p.title || 'Untitled'
            const abstract = (p.abstract || '').substring(0, 150)
            return `\n${i + 1}. **${title}**\n   ${abstract}${abstract.length === 150 ? '...' : ''}`
          }).join('\n')}

${papers.length > 5 ? `\n*...and ${papers.length - 5} more papers to explore!*` : ''}

**What would you like to do next?** 😊`,
          timestamp: new Date(),
          type: 'search',
          metadata: { papers, searchId, queryText },
        }

        setMessages((prev) => prev.filter((m) => m.id !== loadingMessage.id).concat(searchResponse))
      } else if (intent === 'workflow') {
        // Extract query from user message
        let queryText = extractWorkflowQuery(userMessageText)
        if (!queryText) {
          queryText = userMessageText
        }
        
        // Update loading message to show we're researching
        setMessages((prev) => prev.map(m => 
          m.id === loadingMessage.id 
            ? { ...m, content: `🚀 Awesome! I'm diving deep into "${queryText}" for you...\n\nThis might take a minute or two - I've got multiple AI agents working together to:\n1. Plan out the best research strategy\n2. Hunt down the most relevant papers\n3. Analyze and connect the findings\n4. Put together a comprehensive report\n\nHang tight, I'm on it! 😊` }
            : m
        ))
        
        // Start research workflow
        response = await fetch('/api/v1/workflows/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: queryText,
            workflowType: 'full',
            options: {},
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || errorData.message || 'Workflow failed')
        }

        // Handle response - workflow API returns SSE stream
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('text/event-stream')) {
          // Parse SSE stream
          const reader = response.body?.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          let finalResult: any = null

          if (!reader) {
            throw new Error('Failed to read response stream')
          }

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.trim() && line.startsWith('data: ')) {
                try {
                  const jsonStr = line.slice(6).trim()
                  if (!jsonStr || jsonStr === '[DONE]') continue
                  
                  const data = JSON.parse(jsonStr)
                  if (data.type === 'complete' && data.data?.result) {
                    finalResult = data.data.result
                  } else if (data.type === 'complete' && data.result) {
                    finalResult = data.result
                  } else if (data.type === 'status') {
                    // Update progress
                    const agent = data.data?.agent || data.agent
                    const message = data.data?.message || data.message || data.data?.status
                    if (agent && message) {
                      setWorkflowProgress({ agent, message })
                      setMessages((prev) => prev.map(m => 
                        m.id === loadingMessage.id 
                          ? { ...m, content: `🚀 Researching "${queryText}"...\n\n**${agent}**: ${message}` }
                          : m
                      ))
                    }
                  } else if (data.type === 'error') {
                    throw new Error(data.data?.error || data.error || 'Workflow failed')
                  }
                } catch (e) {
                  console.debug('Skipping malformed SSE line:', line.substring(0, 100))
                }
              }
            }
          }

          if (!finalResult) {
            throw new Error('Workflow completed but no result received')
          }

          responseData = { result: finalResult }
        } else {
          responseData = await response.json()
        }
        
        // Extract workflow result
        const result = responseData.result || responseData
        const chatSessionId = result.chatSessionId || result.metadata?.chatSessionId || responseData.chatSessionId

        if (chatSessionId) {
          setSessionId(chatSessionId)
        }

        // Extract data safely
        const papers = Array.isArray(result.papers) ? result.papers : []
        const query = result.query || queryText
        
        // Format response
        // Build content string to avoid nested template literal issues
        let reportSection = ''
        if (result.report) {
          const reportLines = result.report.split('\n')
          const preview = reportLines.slice(0, 10).join('\n')
          const hasMore = reportLines.length > 10
          const moreText = hasMore ? '\n\n*There\'s more in the full report - just ask me if you want to see it!*' : ''
          reportSection = '\n**Here\'s what I found:**\n' + preview + moreText
        } else {
          reportSection = '\n**Analysis complete!**'
        }

        let papersSection = ''
        if (papers.length > 0) {
          const papersList = papers.slice(0, 5).map((p: any, i: number) => {
            const title = p.title || p.name || 'Untitled'
            return '\n' + (i + 1) + '. **' + title + '**'
          }).join('\n')
          papersSection = '\n**Some key papers that stood out:**\n' + papersList
        } else {
          papersSection = '\nHmm, I didn\'t find any papers for this query. Want to try rephrasing it or being more specific?'
        }

        const workflowResponse: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: `Awesome! 🎉 I just finished running a deep research analysis on "${query}" and found some really interesting stuff!

I discovered **${papers.length} papers** that are relevant to your topic.

${reportSection}

${papersSection}

**Now the fun part - ask me anything!** 😊`,
          timestamp: new Date(),
          type: 'workflow',
          metadata: { ...result, chatSessionId, report: result.report, query },
        }

        setMessages((prev) => prev.filter((m) => m.id !== loadingMessage.id).concat(workflowResponse))
        setWorkflowProgress(null) // Clear progress when workflow completes
      } else if (intent === 'question') {
        // Ask question using RAG or chat session
        if (sessionId) {
          // Use chat session API
          response = await fetch(`/api/v1/chat/${sessionId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessageText }),
          })

          if (!response.ok) {
            throw new Error('Failed to get answer')
          }

          responseData = await response.json()

          const questionResponse: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: responseData.assistantMessage?.content || 'No response',
            timestamp: new Date(),
            type: 'question',
            metadata: responseData,
          }

          setMessages((prev) => prev.filter((m) => m.id !== loadingMessage.id).concat(questionResponse))
        } else {
          // Use RAG ask API (general question)
          response = await fetch('/api/v1/rag/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: userMessageText }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to get answer')
          }

          responseData = await response.json()

          const questionResponse: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: responseData.answer || 'No answer found',
            timestamp: new Date(),
            type: 'question',
            metadata: responseData,
          }

          setMessages((prev) => prev.filter((m) => m.id !== loadingMessage.id).concat(questionResponse))
        }
      } else if (intent === 'index') {
        // Index papers from search results
        if (!searchResults || searchResults.papers.length === 0) {
          const errorResponse: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: `Hmm, I don't have any search results to index yet. 😊\n\nWant to search for some papers first? Just say something like "Search for papers about [topic]" and then we can index them together!`,
            timestamp: new Date(),
            type: 'general',
          }
          setMessages((prev) => prev.filter((m) => m.id !== loadingMessage.id).concat(errorResponse))
        } else {
          // Index papers
          setMessages((prev) => prev.map(m => 
            m.id === loadingMessage.id 
              ? { ...m, content: `📚 Indexing ${searchResults.papers.length} papers...\n\nI'm reading through them so I can answer your questions! This will just take a moment.` }
              : m
          ))

          const paperIds = searchResults.papers.map(p => p.id)
          let indexedCount = 0
          let chatSessionId: string | null = null

          // Index papers one by one
          for (const paperId of paperIds) {
            try {
              const indexResponse = await fetch(`/api/v1/papers/${paperId}/index`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ searchId: searchResults.searchId }),
              })

              if (indexResponse.ok) {
                indexedCount++
                const indexData = await indexResponse.json()
                if (indexData.chatSessionId && !chatSessionId) {
                  chatSessionId = indexData.chatSessionId
                }
              }
            } catch (error) {
              console.error(`Failed to index paper ${paperId}:`, error)
            }
          }

          if (chatSessionId) {
            setSessionId(chatSessionId)
          }

          const indexResponse: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: `Perfect! ✨ I've indexed **${indexedCount} out of ${paperIds.length} papers** for you.

Now I can answer questions about them! This is where it gets really fun - I've read through the content and I'm ready to help you explore. 😊

**What would you like to know?** Try asking:
- "What are the main findings?"
- "Summarize the key methodologies"
- "Compare the different approaches"
- Or anything else you're curious about!

I'm all set and excited to help you dive in!`,
            timestamp: new Date(),
            type: 'index',
            metadata: { indexedCount, totalCount: paperIds.length, chatSessionId },
          }

          setMessages((prev) => prev.filter((m) => m.id !== loadingMessage.id).concat(indexResponse))
        }
      } else {
        // General/unsupported - be more helpful
        const generalResponse: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: `Hey! I'm here to help you with research. Here's what I can do:

🔍 **Find Papers** - Just say "Search for papers about [topic]" or "Find papers on [topic]"
🚀 **Deep Research** - Say "Research [topic]" or just mention what you're curious about
❓ **Answer Questions** - Ask me anything about papers we've found together

**Want to get started?** Try something like:
- "Search for papers about transformer architectures"
- "Research attention mechanisms"
- "Find papers on quantum computing"

Or honestly, just tell me what you're interested in and we'll figure it out together! What's on your mind? 😊`,
          timestamp: new Date(),
          type: 'general',
        }

        setMessages((prev) => prev.filter((m) => m.id !== loadingMessage.id).concat(generalResponse))
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Oops! 😅 I ran into a little hiccup: ${error instanceof Error ? error.message : 'Something went wrong'}\n\nNo worries though - want to try again? You can rephrase your request or just ask me something else. I'm here to help!`,
        timestamp: new Date(),
        type: 'general',
      }
      setMessages((prev) => prev.filter((m) => m.id !== loadingMessage.id).concat(errorMessage))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleNewChat = () => {
    console.log('🆕 New Chat button clicked')
    // Clear all state first
    setSessionId(null)
    setSearchResults(null)
    setInput('') // Clear input field
    setSidebarOpen(false) // Close sidebar on mobile after selecting
    setHasInitialized(false) // Reset initialization flag
    
    // Re-initialize welcome message immediately
    if (session) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Hey there! 👋 I'm your research buddy - think of me as your friendly AI assistant who's genuinely excited to help you dive into the world of academic research!

I'm here to make research feel less overwhelming and more like an adventure. Whether you're looking for papers, running deep analyses, or just curious about what's out there, I've got your back.

**Here's what I can help you with:**

🔍 **Finding Papers** - Just tell me what you're curious about!
   - "Search for papers about transformer architectures"
   - "Find research on quantum computing" 
   - "Look for papers on attention mechanisms"

🚀 **Deep Research** - I'll run full workflows with multiple AI agents working together
   - "Research attention mechanisms in transformers"
   - "Analyze recent papers on large language models"
   - Just mention a topic and I'll dive deep!

❓ **Answering Questions** - Ask me anything about papers we've found
   - "What are the main findings?"
   - "Summarize the key methodologies"
   - "Compare the different approaches"

**Want to get started?** Just say something like:
- "Search for papers about GPT-4"
- "Research transformer architectures" 
- "Find papers on reinforcement learning"

Or honestly, just tell me what you're curious about and we'll figure it out together! What's on your mind? 😊`,
        timestamp: new Date(),
        type: 'general',
      }
      // Set messages with welcome message
      setMessages([welcomeMessage])
      setHasInitialized(true)
      console.log('✅ Welcome message set for new chat')
    } else {
      // If no session, just clear messages
      setMessages([])
    }
    
    // Focus input after a brief delay to ensure state is updated
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const handleSelectSession = async (selectedSessionId: string) => {
    console.log('handleSelectSession called with:', selectedSessionId)
    setSessionId(selectedSessionId)
    setSidebarOpen(false) // Close sidebar on mobile after selecting
    
    // Load messages for this session
    try {
      const response = await fetch(`/api/v1/chat/${selectedSessionId}/messages`)
      if (response.ok) {
        const sessionMessages = await response.json()
        const formattedMessages: Message[] = sessionMessages.map((msg: any) => ({
          id: msg.id,
          role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          type: 'question',
        }))
        setMessages(formattedMessages)
        setHasInitialized(true) // Mark as initialized when loading existing session
        console.log('Loaded', formattedMessages.length, 'messages for session')
      } else {
        console.error('Failed to load session messages:', response.status)
      }
    } catch (error) {
      console.error('Failed to load session messages:', error)
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden relative">
      {/* Subtle background glow effect */}
      <div className="fixed inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
      
      {/* Top Header Bar */}
      <div className="fixed top-0 left-0 right-0 h-12 sm:h-14 bg-black/80 backdrop-blur-sm border-b border-white/10 z-50 flex items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded hover:bg-white/5 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
          {/* <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/10 flex items-center justify-center">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div> */}
          <span className="text-xs sm:text-sm font-medium text-white">ResearchOS</span>
          <ChevronDown className="hidden sm:block w-4 h-4 text-white/60" />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="p-1.5 sm:p-2 rounded hover:bg-white/5 transition-colors"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-black border border-white/10 rounded-lg shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-white/10">
                  <p className="text-sm font-medium text-white">{session?.user?.name || 'User'}</p>
                  <p className="text-xs text-white/60">{session?.user?.email}</p>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white/90 hover:bg-white/5 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false)
                    signOut({ callbackUrl: '/' })
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white/90 hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
          </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Sidebar */}
      <ChatSidebar
        currentSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Command Hints */}
      <CommandHints
        isVisible={showCommandHints}
        onClose={() => {
          setShowCommandHints(false)
          // Remove "/" from input if it was just typed
          if (input === '/') {
            setInput('')
          }
        }}
        onSelectCommand={(command) => {
          setInput(command)
          inputRef.current?.focus()
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 pt-12 sm:pt-14">

      {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <p className="text-lg sm:text-xl text-white/90 mb-8">Ready when you are.</p>
            </div>
          </div>
        ) : (
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 sm:gap-4 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[90%] sm:max-w-[85%] rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 ${
                  message.role === 'user'
                    ? 'bg-white text-black'
                    : message.id.startsWith('loading')
                    ? 'bg-white/5 text-white/60 border border-white/10'
                    : 'bg-white/5 text-white border border-white/10'
                }`}
              >
                {message.id.startsWith('loading') ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">{message.content || 'Processing...'}</span>
                    </div>
                    {workflowProgress && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse"></div>
                          <span className="text-xs text-white/60 font-medium">{workflowProgress.agent}</span>
                        </div>
                        <p className="text-xs text-white/50 pl-4">{workflowProgress.message}</p>
                      </div>
                    )}
                    {message.type === 'workflow' && !workflowProgress && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/30"></div>
                          <span>Planning research strategy...</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : message.role === 'assistant' ? (
                  <div className="prose prose-invert prose-sm max-w-none text-sm sm:text-base">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 sm:mb-3 last:mb-0 text-sm sm:text-base leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 sm:pl-5 mb-2 sm:mb-3 space-y-1 text-sm sm:text-base">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 sm:pl-5 mb-2 sm:mb-3 space-y-1 text-sm sm:text-base">{children}</ol>,
                        li: ({ children }) => <li className="text-white/80 text-sm sm:text-base">{children}</li>,
                        strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                        code: ({ children }) => (
                          <code className="bg-white/10 px-1 sm:px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono text-white/90">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-white/10 p-2 sm:p-3 rounded-lg overflow-x-auto mb-2 sm:mb-3 text-xs sm:text-sm text-white/90">
                            {children}
                          </pre>
                        ),
                        h1: ({ children }) => <h1 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base sm:text-lg font-bold mb-2 sm:mb-3">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm sm:text-base font-bold mb-2">{children}</h3>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
                )}
                
                {/* Quick Actions */}
                {message.type === 'search' && message.metadata?.papers && (
                  <QuickActions
                    type="search"
                    papers={message.metadata.papers}
                    searchId={message.metadata.searchId}
                    onIndex={async () => {
                      const papers = message.metadata.papers || []
                      const paperIds = papers.map((p: any) => p.id).filter(Boolean)
                      if (paperIds.length === 0) return

                      const loadingMsg: Message = {
                        id: `loading-index-${Date.now()}`,
                        role: 'assistant',
                        content: '📚 Indexing papers...',
                        timestamp: new Date(),
                        type: 'index',
                      }
                      setMessages((prev) => [...prev, loadingMsg])

                      try {
                        let indexedCount = 0
                        let chatSessionId: string | null = null

                        for (const paperId of paperIds) {
                          try {
                            const indexResponse = await fetch(`/api/v1/papers/${paperId}/index`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ searchId: message.metadata.searchId }),
                            })

                            if (indexResponse.ok) {
                              indexedCount++
                              const indexData = await indexResponse.json()
                              if (indexData.chatSessionId && !chatSessionId) {
                                chatSessionId = indexData.chatSessionId
                              }
                            }
                          } catch (error) {
                            console.error(`Failed to index paper ${paperId}:`, error)
                          }
                        }

                        if (chatSessionId) {
                          setSessionId(chatSessionId)
                        }

                        const indexResponse: Message = {
                          id: `assistant-${Date.now()}`,
                          role: 'assistant',
                          content: `Perfect! ✨ I've indexed **${indexedCount} out of ${paperIds.length} papers** for you.\n\nNow I can answer questions about them! This is where it gets really fun - I've read through the content and I'm ready to help you explore. 😊`,
                          timestamp: new Date(),
                          type: 'index',
                          metadata: { indexedCount, totalCount: paperIds.length, chatSessionId },
                        }

                        setMessages((prev) => prev.filter((m) => m.id !== loadingMsg.id).concat(indexResponse))
                      } catch (error) {
                        console.error('Indexing error:', error)
                      }
                    }}
                    onResearch={(query) => {
                      const queryText = message.metadata?.queryText || query || ''
                      if (queryText) {
                        setInput(`Research ${queryText}`)
                        setTimeout(() => sendMessage(), 100)
                      }
                    }}
                  />
                )}

                {message.type === 'workflow' && message.metadata?.report && (
                  <QuickActions
                    type="workflow"
                    report={message.metadata.report}
                    onExport={async () => {
                      const report = message.metadata?.report || ''
                      const query = message.metadata?.query || 'Research Report'
                      
                      // Create a downloadable file
                      const blob = new Blob([report], { type: 'text/markdown' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${query.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report_${new Date().toISOString().split('T')[0]}.md`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }}
                  />
                )}

                {message.type === 'index' && (
                  <QuickActions type="index" />
                )}
                
                <div className="mt-2 text-xs text-white/40">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        )}
      </div>

      {/* Input */}
        <div className={`border-t border-white/10 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 bg-black flex-shrink-0 ${messages.length === 0 ? 'flex items-center justify-center' : ''}`}>
          <div className={`${messages.length === 0 ? 'w-full max-w-2xl' : 'max-w-3xl mx-auto w-full'}`}>
          <div className="relative flex items-end gap-1.5 sm:gap-2 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 p-2.5 sm:p-3 focus-within:border-white/20 transition-colors">
            <button 
              onClick={() => setShowCommandHints(true)}
              className="p-1 sm:p-1.5 rounded hover:bg-white/5 transition-colors flex-shrink-0"
              title="Show commands"
            >
              <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                const value = e.target.value
                setInput(value)
                // Show command hints when user types "/"
                if (value === '/') {
                  setShowCommandHints(true)
                }
                e.target.style.height = 'auto'
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
              }}
              onKeyPress={handleKeyPress}
              placeholder={messages.length === 0 ? "Ask anything or type '/' for commands" : "Ask anything"}
              className="flex-1 bg-transparent text-white placeholder-white/40 resize-none focus:outline-none text-xs sm:text-sm"
              rows={1}
              disabled={isLoading}
              style={{ maxHeight: '200px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="p-1.5 sm:p-2 rounded hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
