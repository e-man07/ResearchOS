'use client'

import { useState } from 'react'
import { Loader2, MessageSquare, CheckCircle2 } from 'lucide-react'
import { indexPapersWithChat } from '@/lib/chat-utils'

interface IndexPapersButtonProps {
  paperIds: string[]
  searchId: string
  onComplete?: (chatSessionId: string) => void
}

export default function IndexPapersButton({
  paperIds,
  searchId,
  onComplete,
}: IndexPapersButtonProps) {
  const [isIndexing, setIsIndexing] = useState(false)
  const [progress, setProgress] = useState({ indexed: 0, total: 0 })
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleIndex = async () => {
    setIsIndexing(true)
    setError(null)
    setProgress({ indexed: 0, total: paperIds.length })

    try {
      const result = await indexPapersWithChat(
        paperIds,
        searchId,
        (indexed, total) => {
          setProgress({ indexed, total })
        }
      )

      setIsComplete(true)
      console.log(`✅ Indexed ${result.indexed} papers, chat session: ${result.chatSessionId}`)
      
      // Notify parent component
      onComplete?.(result.chatSessionId)
    } catch (error) {
      console.error('Indexing error:', error)
      setError(error instanceof Error ? error.message : 'Failed to index papers')
    } finally {
      setIsIndexing(false)
    }
  }

  if (isComplete) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="w-5 h-5" />
        <span className="text-sm font-medium">
          Chat ready! {progress.indexed} papers indexed
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleIndex}
        disabled={isIndexing || paperIds.length === 0}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isIndexing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>
              Indexing... {progress.indexed}/{progress.total}
            </span>
          </>
        ) : (
          <>
            <MessageSquare className="w-4 h-4" />
            <span>Index Papers & Start Chat</span>
          </>
        )}
      </button>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {isIndexing && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(progress.indexed / progress.total) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  )
}
