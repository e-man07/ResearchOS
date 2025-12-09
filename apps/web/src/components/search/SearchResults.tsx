'use client'

import { PaperCard, type Paper } from './PaperCard'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface SearchResultsProps {
  papers: Paper[]
  isLoading: boolean
  error?: string
  query?: string
  onSelectPaper?: (paper: Paper) => void
}

export function SearchResults({
  papers,
  isLoading,
  error,
  query,
  onSelectPaper,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Searching for papers...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Search Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (papers.length === 0 && query) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="p-6 bg-gray-50 border-2 border-gray-200 rounded-lg text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">No Results Found</h3>
          <p className="text-gray-600">
            No papers found for &quot;{query}&quot;. Try different keywords or sources.
          </p>
        </div>
      </div>
    )
  }

  if (papers.length === 0) {
    return null
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Results Header */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <span>
          Found <strong className="text-gray-900">{papers.length}</strong> papers
          {query && (
            <>
              {' '}
              for &quot;<strong className="text-gray-900">{query}</strong>&quot;
            </>
          )}
        </span>
      </div>

      {/* Papers Grid */}
      <div className="space-y-4">
        {papers.map((paper) => (
          <PaperCard key={paper.id} paper={paper} onSelect={onSelectPaper} />
        ))}
      </div>
    </div>
  )
}
