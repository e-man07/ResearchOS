'use client'

import { ExternalLink, Calendar, Users, FileText, Star } from 'lucide-react'

export interface Paper {
  id: string
  title: string
  authors: Array<{ name: string }>
  abstract?: string
  year?: number
  venue?: string
  citationCount?: number
  url?: string
  source: string
}

interface PaperCardProps {
  paper: Paper
  onSelect?: (paper: Paper) => void
}

export function PaperCard({ paper, onSelect }: PaperCardProps) {
  const authorNames = paper.authors.slice(0, 3).map((a) => a.name).join(', ')
  const hasMoreAuthors = paper.authors.length > 3

  return (
    <div className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="text-xl font-semibold text-gray-900 leading-tight flex-1">
          {paper.title}
        </h3>
        {paper.url && (
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Open paper"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        )}
      </div>

      {/* Authors */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
        <Users className="w-4 h-4" />
        <span>
          {authorNames}
          {hasMoreAuthors && ` +${paper.authors.length - 3} more`}
        </span>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
        {paper.year && (
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{paper.year}</span>
          </div>
        )}

        {paper.venue && (
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span className="truncate max-w-xs">{paper.venue}</span>
          </div>
        )}

        {paper.citationCount !== undefined && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            <span>{paper.citationCount} citations</span>
          </div>
        )}

        <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded">
          {paper.source}
        </span>
      </div>

      {/* Abstract */}
      {paper.abstract && (
        <p className="text-sm text-gray-700 line-clamp-3 mb-4">
          {paper.abstract}
        </p>
      )}

      {/* Actions */}
      {onSelect && (
        <button
          onClick={() => onSelect(paper)}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
        >
          View Details
        </button>
      )}
    </div>
  )
}
