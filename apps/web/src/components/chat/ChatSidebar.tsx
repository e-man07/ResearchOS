'use client'

import { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  Plus, 
  History, 
  Trash2, 
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  Search,
  FileText,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'
// Simple date formatter
const formatTimeAgo = (date: Date | null): string => {
  if (!date) return 'No messages'
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(date).toLocaleDateString()
}

interface ChatSession {
  id: string
  searchId: string
  title: string
  description: string
  paperCount: number
  totalMessages: number
  lastMessageAt: Date | null
  createdAt: Date
}

interface ChatSidebarProps {
  currentSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onNewChat: () => void
  isOpen: boolean
  isCollapsed?: boolean
  onClose?: () => void
  onToggleCollapse?: () => void
}

export function ChatSidebar({
  currentSessionId,
  onSelectSession,
  onNewChat,
  isOpen,
  isCollapsed = false,
  onClose,
  onToggleCollapse,
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadSessions()
  }, []) // Load on mount

  useEffect(() => {
    // Reload when sidebar opens (for mobile)
    if (isOpen) {
      loadSessions()
    }
  }, [isOpen])

  const loadSessions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/v1/chat/sessions/history')
      if (response.ok) {
        const data = await response.json()
        setSessions(data || [])
        setFilteredSessions(data || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to load chat history')
        console.error('Failed to load chat history:', response.status, errorData)
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getSessionTitle = (session: ChatSession) => {
    // Remove "Chat: " prefix if present
    return session.title.replace(/^Chat:\s*/i, '') || 'Untitled Chat'
  }

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this chat?')) return

    setIsDeleting(sessionId)
    try {
      const response = await fetch(`/api/v1/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        const updatedSessions = sessions.filter(s => s.id !== sessionId)
        setSessions(updatedSessions)
        setFilteredSessions(filteredSessions.filter(s => s.id !== sessionId))
        if (currentSessionId === sessionId) {
          onNewChat()
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    } finally {
      setIsDeleting(null)
    }
  }

  // Filter sessions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSessions(sessions)
      return
    }
    
    const query = searchQuery.toLowerCase()
    const filtered = sessions.filter(session => {
      const title = (session.title.replace(/^Chat:\s*/i, '') || 'Untitled Chat').toLowerCase()
      const description = (session.description || '').toLowerCase()
      return title.includes(query) || description.includes(query)
    })
    setFilteredSessions(filtered)
  }, [searchQuery, sessions])

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-12 sm:top-14 h-[calc(100vh-3rem)] sm:h-[calc(100vh-3.5rem)] bg-black border-r border-white/10 z-30 transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isCollapsed ? 'w-16 lg:w-16' : 'w-80 lg:w-80'
        } lg:translate-x-0 lg:fixed lg:z-auto`}
      >
        <div className="flex flex-col h-full relative">
          {/* Header with New Chat and Collapse Toggle */}
          <div className={`px-4 py-3 border-b border-white/10 ${isCollapsed ? 'px-2' : ''} relative`}>
            <div className="flex items-center gap-2 w-full">
              {/* New Chat Button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('New Chat button clicked in sidebar')
                  if (onNewChat) {
                    onNewChat()
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-medium flex-shrink-0 min-w-0"
                title={isCollapsed ? 'New Chat' : undefined}
                type="button"
                aria-label="Start new chat"
              >
                <Plus className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">New Chat</span>}
              </button>
              
              {/* Collapse Toggle Button (Desktop only) */}
              {onToggleCollapse && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('Toggle collapse clicked, current state:', isCollapsed)
                    onToggleCollapse()
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  className="hidden lg:flex w-9 h-9 min-w-[2.25rem] bg-white/10 border border-white/20 rounded-lg items-center justify-center hover:bg-white/20 hover:border-white/30 active:bg-white/30 transition-all flex-shrink-0 shadow-sm cursor-pointer relative z-[100]"
                  title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  type="button"
                  aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isCollapsed ? (
                    <PanelLeftOpen className="w-5 h-5 text-white pointer-events-none" />
                  ) : (
                    <PanelLeftClose className="w-5 h-5 text-white pointer-events-none" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Chat History Section */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className={`px-4 py-3 border-b border-white/10 ${isCollapsed ? 'px-2' : ''}`}>
              {!isCollapsed && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-medium text-white uppercase tracking-wider">Chat History</h2>
                    {onClose && (
                      <button
                        onClick={onClose}
                        className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search chats..."
                      className="w-full pl-8 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/20 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-white/40" />
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-sm text-red-400 mb-2">{error}</p>
                <button
                  onClick={loadSessions}
                  className="text-xs text-white/60 hover:text-white underline"
                >
                  Retry
                </button>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-6 text-center">
                {searchQuery ? (
                  <>
                    <Search className="w-12 h-12 mx-auto mb-3 text-white/20" />
                    <p className="text-sm text-white/60 mb-1">No chats found</p>
                    <p className="text-xs text-white/40">Try a different search term</p>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-white/20" />
                    <p className="text-sm text-white/60 mb-1">No chat history</p>
                    <p className="text-xs text-white/40">Start a new conversation to see it here</p>
                  </>
                )}
              </div>
            ) : (
              <div className={`p-2 space-y-1 ${isCollapsed ? 'px-1' : ''}`}>
                {filteredSessions.map((session) => {
                  const isActive = currentSessionId === session.id
                  return (
                    <button
                      key={session.id}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('Session clicked:', session.id)
                        onSelectSession(session.id)
                      }}
                      className={`group relative rounded-lg cursor-pointer transition-all w-full text-left ${
                        isCollapsed ? 'p-2 flex justify-center' : 'p-3'
                      } ${
                        isActive
                          ? 'bg-white/10 border border-white/20'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                      title={isCollapsed ? getSessionTitle(session) : undefined}
                      type="button"
                    >
                      <div className={`flex items-start gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          isActive ? 'bg-white/10' : 'bg-white/5 group-hover:bg-white/10'
                        }`}>
                          <MessageSquare className={`w-4 h-4 ${
                            isActive ? 'text-white' : 'text-white/60'
                          }`} />
                        </div>
                        
                        {!isCollapsed && (
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-sm font-medium truncate mb-1 ${
                              isActive ? 'text-white' : 'text-white/90'
                            }`}>
                              {getSessionTitle(session)}
                            </h3>
                          
                            <div className="flex items-center gap-3 text-xs text-white/40 mb-1">
                              {session.paperCount > 0 && (
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {session.paperCount}
                                </span>
                              )}
                              {session.totalMessages > 0 && (
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {session.totalMessages}
                                </span>
                              )}
                            </div>
                          
                            {session.lastMessageAt && (
                              <p className="text-xs text-white/30">
                                {formatTimeAgo(session.lastMessageAt)}
                              </p>
                            )}
                          </div>
                        )}

                        {!isCollapsed && (
                          <button
                            onClick={(e) => handleDelete(session.id, e)}
                            className={`opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-red-400 transition-all flex-shrink-0 ${
                              isDeleting === session.id ? 'opacity-100' : ''
                            }`}
                            disabled={isDeleting === session.id}
                          >
                            {isDeleting === session.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
            </div>

            {/* Footer */}
            {!isCollapsed && (
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <History className="w-4 h-4" />
                  <span>{sessions.length} conversation{sessions.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[25] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    </>
  )
}

