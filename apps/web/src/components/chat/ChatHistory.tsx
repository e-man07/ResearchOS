'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Clock, Trash2, Loader2 } from 'lucide-react'

interface ChatSession {
  id: string
  searchId: string
  title: string
  description: string | null
  paperCount: number
  totalMessages: number
  lastMessageAt: string | null
  createdAt: string
}

interface ChatHistoryProps {
  currentSessionId?: string | null
  onSelectSession: (sessionId: string, searchId: string, title: string) => void
}

export default function ChatHistory({
  currentSessionId,
  onSelectSession,
}: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchChatHistory()
  }, [])

  const fetchChatHistory = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/v1/chat/sessions/history')
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat history')
      }

      const data = await response.json()
      setSessions(data)
    } catch (error) {
      console.error('Error fetching chat history:', error)
      setError('Failed to load chat history')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent selecting the session
    
    if (!confirm('Are you sure you want to delete this chat session?')) {
      return
    }

    try {
      const response = await fetch(`/api/v1/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete session')
      }

      // Remove from list
      setSessions(sessions.filter(s => s.id !== sessionId))
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Failed to delete chat session')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 text-sm">
        {error}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">No chat history yet</p>
        <p className="text-xs mt-1">Start by searching and indexing papers</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="px-4 py-2 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Chat History
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id, session.searchId, session.title)}
            className={`w-full text-left p-4 hover:bg-gray-50 transition-colors border-l-4 ${
              currentSessionId === session.id
                ? 'border-l-blue-600 bg-blue-50'
                : 'border-l-transparent'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate text-sm">
                  {session.title.replace('Chat: ', '')}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span>{session.paperCount} papers</span>
                  <span>•</span>
                  <span>{session.totalMessages} messages</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(session.lastMessageAt || session.createdAt)}
                </p>
              </div>
              <button
                onClick={(e) => deleteSession(session.id, e)}
                className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-600 transition-colors"
                title="Delete session"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
