'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'

export interface SearchFormData {
  query: string
  sources: string[]
  yearFrom?: number
  yearTo?: number
  maxResults: number
}

interface SearchFormProps {
  onSearch: (data: SearchFormData) => void
  isLoading?: boolean
}

export function SearchForm({ onSearch, isLoading = false }: SearchFormProps) {
  const [query, setQuery] = useState('')
  const [sources, setSources] = useState<string[]>(['arxiv', 'semantic_scholar'])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [yearFrom, setYearFrom] = useState<number>()
  const [yearTo, setYearTo] = useState<number>()
  const [maxResults, setMaxResults] = useState(20)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    onSearch({
      query: query.trim(),
      sources,
      yearFrom,
      yearTo,
      maxResults,
    })
  }

  const toggleSource = (source: string) => {
    setSources((prev) =>
      prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-6">
      {/* Main Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search research papers... (e.g., 'attention mechanisms in transformers')"
          className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none pr-12"
          disabled={isLoading}
        />
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
      </div>

      {/* Source Selection */}
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={sources.includes('arxiv')}
            onChange={() => toggleSource('arxiv')}
            className="w-4 h-4"
            disabled={isLoading}
          />
          <span className="font-medium">arXiv</span>
        </label>

        <label className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={sources.includes('semantic_scholar')}
            onChange={() => toggleSource('semantic_scholar')}
            className="w-4 h-4"
            disabled={isLoading}
          />
          <span className="font-medium">Semantic Scholar</span>
        </label>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          disabled={isLoading}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year From
            </label>
            <input
              type="number"
              value={yearFrom || ''}
              onChange={(e) => setYearFrom(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="2020"
              min="1900"
              max={new Date().getFullYear()}
              className="w-full px-3 py-2 border rounded-lg focus:border-blue-500 focus:outline-none"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year To
            </label>
            <input
              type="number"
              value={yearTo || ''}
              onChange={(e) => setYearTo(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder={new Date().getFullYear().toString()}
              min="1900"
              max={new Date().getFullYear()}
              className="w-full px-3 py-2 border rounded-lg focus:border-blue-500 focus:outline-none"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Results
            </label>
            <select
              value={maxResults}
              onChange={(e) => setMaxResults(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:border-blue-500 focus:outline-none"
              disabled={isLoading}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !query.trim() || sources.length === 0}
        className="w-full px-6 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Search Papers
          </>
        )}
      </button>
    </form>
  )
}
