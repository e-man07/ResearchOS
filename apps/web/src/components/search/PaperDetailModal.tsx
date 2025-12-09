'use client'

import { useState } from 'react'
import { X, ExternalLink, Download, Sparkles, CheckCircle } from 'lucide-react'
import { type Paper } from './PaperCard'

interface PaperDetailModalProps {
  paper: Paper
  onClose: () => void
}

export function PaperDetailModal({ paper, onClose }: PaperDetailModalProps) {
  const [isIndexing, setIsIndexing] = useState(false)
  const [isIndexed, setIsIndexed] = useState(false)
  const [indexError, setIndexError] = useState<string>()

  const handleIndex = async () => {
    setIsIndexing(true)
    setIndexError(undefined)

    try {
      const response = await fetch(`/api/v1/papers/${paper.id}/index`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to index paper')
      }

      const result = await response.json()
      console.log('Indexing result:', result)
      setIsIndexed(true)
    } catch (error) {
      setIndexError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsIndexing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
          <h2 className="text-2xl font-bold text-gray-900 pr-8">{paper.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Authors */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Authors</h3>
            <p className="text-gray-900">
              {paper.authors.map((a) => a.name).join(', ')}
            </p>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {paper.year && <span>📅 {paper.year}</span>}
            {paper.venue && <span>📍 {paper.venue}</span>}
            {paper.citationCount !== undefined && (
              <span>⭐ {paper.citationCount} citations</span>
            )}
            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
              {paper.source}
            </span>
          </div>

          {/* Abstract */}
          {paper.abstract && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Abstract</h3>
              <p className="text-gray-700 leading-relaxed">{paper.abstract}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
            {paper.url && (
              <a
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Paper
              </a>
            )}

            <button
              onClick={handleIndex}
              disabled={isIndexing || isIndexed}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isIndexing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Indexing...
                </>
              ) : isIndexed ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Indexed
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Index with RAG
                </>
              )}
            </button>

            {paper.url && (
              <a
                href={paper.url.replace('/abs/', '/pdf/')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
            )}
          </div>

          {/* Index Status */}
          {indexError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {indexError}
            </div>
          )}

          {isIndexed && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              ✅ Paper has been indexed! You can now ask questions about it using the RAG system.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
