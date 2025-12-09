'use client'

import { useState } from 'react'
import { Sparkles, Loader2, MessageCircle, BookOpen, TrendingUp, Search as SearchIcon } from 'lucide-react'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'
import Link from 'next/link'

interface RAGResult {
  answer: string
  sources: Array<{
    paperId: string
    title: string
    content: string
    score: number
  }>
}

export default function RAGPage() {
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<RAGResult | null>(null)
  const [error, setError] = useState<string>()

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    setIsLoading(true)
    setError(undefined)
    setResult(null)

    try {
      const response = await fetch('/api/v1/rag/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get answer')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                💬 RAG Q&A
              </h1>
              <p className="text-gray-600">
                Ask questions about your indexed papers • Powered by GPT-4o
              </p>
            </div>
            <Link
              href="/search"
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <SearchIcon className="w-4 h-4" />
              <span className="font-medium">Search Papers</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Question Form */}
          <form onSubmit={handleAsk} className="space-y-4">
            <div className="relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about your indexed papers... (e.g., 'What are attention mechanisms in transformers?')"
                rows={4}
                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none resize-none transition-all"
                disabled={isLoading}
              />
              <MessageCircle className="absolute right-4 top-4 text-gray-400 w-6 h-6" />
            </div>

            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Searching & Generating Answer...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Ask Question</span>
                </>
              )}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Answer */}
              <div className="p-8 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 border-2 border-green-200 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-7 h-7 text-green-600" />
                  Answer
                </h2>
                <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl">
                  <MarkdownRenderer content={result.answer} />
                </div>
              </div>

              {/* Sources */}
              {result.sources && result.sources.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                    Sources ({result.sources.length})
                  </h3>
                  <div className="grid gap-4">
                    {result.sources.map((source, index) => (
                      <div
                        key={index}
                        className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 text-lg mb-1">
                                {source.title}
                              </h4>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-semibold text-green-600">
                                  {Math.round(source.score * 100)}% relevance
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                          {source.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Help Text */}
          {!result && !isLoading && (
            <div className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                How to use RAG Q&A
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl">
                  <div className="text-3xl mb-2">📚</div>
                  <h4 className="font-semibold text-gray-900 mb-1">1. Index Papers</h4>
                  <p className="text-sm text-gray-600">Search and index papers from the search page</p>
                </div>
                <div className="p-4 bg-white rounded-xl">
                  <div className="text-3xl mb-2">❓</div>
                  <h4 className="font-semibold text-gray-900 mb-1">2. Ask Questions</h4>
                  <p className="text-sm text-gray-600">Type your question in natural language</p>
                </div>
                <div className="p-4 bg-white rounded-xl">
                  <div className="text-3xl mb-2">🤖</div>
                  <h4 className="font-semibold text-gray-900 mb-1">3. Get AI Answers</h4>
                  <p className="text-sm text-gray-600">GPT-4o generates answers from your papers</p>
                </div>
                <div className="p-4 bg-white rounded-xl">
                  <div className="text-3xl mb-2">📊</div>
                  <h4 className="font-semibold text-gray-900 mb-1">4. View Sources</h4>
                  <p className="text-sm text-gray-600">See which papers were used with relevance scores</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
