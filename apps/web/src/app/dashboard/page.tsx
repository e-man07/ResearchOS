'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search as SearchIcon, FileText, TrendingUp, Clock, Workflow, MessageSquare, BookOpen, ExternalLink, Sparkles, User, LogOut, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'

interface SearchHistory {
  id: string
  query: string
  status: string
  totalResults: number
  createdAt: string
}

interface WorkflowHistory {
  id: string
  query: string
  status: string
  totalPapers: number
  createdAt: string
  chatSessionId?: string
}

interface IndexedPaper {
  id: string
  title: string
  abstract: string
  year: number
  venue?: string
  topics: string[]
  keywords: string[]
  pdfUrl?: string
  source: string
  sourceId: string
  createdAt: string
  chunkCount: number
  usedInWorkflows: Array<{
    query: string
    date: string
  }>
  workflowCount: number
  indexedViaSearch: boolean
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [searches, setSearches] = useState<SearchHistory[]>([])
  const [workflows, setWorkflows] = useState<WorkflowHistory[]>([])
  const [indexedPapers, setIndexedPapers] = useState<IndexedPaper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'searches' | 'workflows' | 'papers'>('workflows')
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent('/dashboard')}`)
    }
  }, [status, router])

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    try {
      // Fetch searches
      const searchResponse = await fetch('/api/v1/searches')
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        setSearches(searchData)
      }

      // Fetch workflows
      const workflowResponse = await fetch('/api/v1/workflows/history')
      if (workflowResponse.ok) {
        const workflowData = await workflowResponse.json()
        setWorkflows(workflowData)
      }

      // Fetch indexed papers
      const papersResponse = await fetch('/api/v1/papers/indexed')
      if (papersResponse.ok) {
        const papersData = await papersResponse.json()
        setIndexedPapers(papersData.papers || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (status === 'unauthenticated' || !session) {
    return null
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-white">Research<span className="text-white/60">OS</span></span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/chat"
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-white/90 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Chat</span>
                </div>
              </Link>
              
              {/* Profile Menu */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 transition-colors"
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
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            Welcome back, {session?.user?.name}!
          </h1>
          <p className="text-sm sm:text-base text-white/60">
            Here&apos;s an overview of your research activity
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12">
          <div className="p-4 sm:p-6 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 bg-blue-500/20 rounded-lg">
                <SearchIcon className="w-5 h-5 sm:w-8 sm:h-8 text-blue-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white/60">Searches</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{searches.length}</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 bg-purple-500/20 rounded-lg">
                <Workflow className="w-5 h-5 sm:w-8 sm:h-8 text-purple-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white/60">Workflows</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{workflows.length}</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 bg-green-500/20 rounded-lg">
                <FileText className="w-5 h-5 sm:w-8 sm:h-8 text-green-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white/60">Total Papers</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {searches.reduce((sum, s) => sum + (s.totalResults || 0), 0) +
                    workflows.reduce((sum, w) => sum + (w.totalPapers || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 bg-orange-500/20 rounded-lg">
                <MessageSquare className="w-5 h-5 sm:w-8 sm:h-8 text-orange-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white/60">Chat Sessions</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {workflows.filter((w) => w.chatSessionId).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Link
              href="/chat"
              className="p-4 sm:p-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-3 sm:gap-4"
            >
              <SearchIcon className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold">New Search</h3>
                <p className="text-xs sm:text-sm text-blue-100">Search for research papers</p>
              </div>
            </Link>

            <Link
              href="/chat"
              className="p-4 sm:p-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-3 sm:gap-4"
            >
              <Workflow className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold">New Workflow</h3>
                <p className="text-xs sm:text-sm text-purple-100">Generate research reports</p>
              </div>
            </Link>

            <Link
              href="/chat"
              className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 hover:bg-white/10 transition-all flex items-center gap-3 sm:gap-4 sm:col-span-2 lg:col-span-1"
            >
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-white flex-shrink-0" />
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white">RAG Chat</h3>
                <p className="text-xs sm:text-sm text-white/60">Chat with your papers</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Recent Activity</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              <button
                onClick={() => setActiveTab('workflows')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'workflows'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-white/90 border border-white/10 hover:border-purple-400 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Workflow className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Workflows</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('searches')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'searches'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-white/90 border border-white/10 hover:border-blue-400 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <SearchIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Searches</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('papers')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'papers'
                    ? 'bg-green-600 text-white'
                    : 'bg-white/5 text-white/90 border border-white/10 hover:border-green-400 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Papers ({indexedPapers.length})</span>
                </div>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm sm:text-base text-white/60 mt-4">Loading...</p>
            </div>
          ) : activeTab === 'workflows' ? (
            workflows.length === 0 ? (
              <div className="p-8 sm:p-12 bg-white/5 border border-white/10 rounded-lg text-center">
                <Workflow className="w-12 h-12 sm:w-16 sm:h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                  No workflows yet
                </h3>
                <p className="text-sm sm:text-base text-white/60 mb-4 sm:mb-6">
                  Start your first workflow to generate research reports
                </p>
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-purple-600 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Workflow className="w-4 h-4 sm:w-5 sm:h-5" />
                  Create Workflow
                </Link>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {workflows.slice(0, 10).map((workflow) => (
                  <div
                    key={workflow.id}
                    className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded-lg hover:border-purple-400 hover:bg-white/10 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-2 break-words">
                          {workflow.query}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-white/60">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>
                              {new Date(workflow.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>{workflow.totalPapers} papers</span>
                          </div>
                          {workflow.chatSessionId && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span>Chat available</span>
                            </div>
                          )}
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              workflow.status === 'COMPLETED'
                                ? 'bg-green-500/20 text-green-400'
                                : workflow.status === 'RUNNING'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {workflow.status}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/chat`}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
                      >
                        View Report
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'searches' ? (
            searches.length === 0 ? (
            <div className="p-8 sm:p-12 bg-white/5 border border-white/10 rounded-lg text-center">
              <SearchIcon className="w-12 h-12 sm:w-16 sm:h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                No searches yet
              </h3>
              <p className="text-sm sm:text-base text-white/60 mb-4 sm:mb-6">
                Start your first search to see results here
              </p>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <SearchIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                Start Searching
              </Link>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {searches.slice(0, 10).map((search) => (
                <div
                  key={search.id}
                  className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded-lg hover:border-blue-400 hover:bg-white/10 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-white mb-2 break-words">
                        {search.query}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-white/60">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>
                            {new Date(search.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>{search.totalResults} results</span>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            search.status === 'COMPLETED'
                              ? 'bg-green-500/20 text-green-400'
                              : search.status === 'PENDING'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {search.status}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/chat`}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
                    >
                      View Results
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            )
          ) : activeTab === 'papers' ? (
            indexedPapers.length === 0 ? (
              <div className="p-8 sm:p-12 bg-white/5 border border-white/10 rounded-lg text-center">
                <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                  No indexed papers yet
                </h3>
                <p className="text-sm sm:text-base text-white/60 mb-4 sm:mb-6">
                  Run a workflow to index papers and see them here
                </p>
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Workflow className="w-4 h-4 sm:w-5 sm:h-5" />
                  Create Workflow
                </Link>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {indexedPapers.map((paper) => (
                  <div
                    key={paper.id}
                    className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded-lg hover:border-green-400 hover:bg-white/10 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-2 break-words">
                          {paper.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-white/60 mb-3 line-clamp-2">
                          {paper.abstract}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white/60 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>{paper.year}</span>
                          </div>
                          {paper.venue && (
                            <div className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="truncate max-w-[150px] sm:max-w-none">{paper.venue}</span>
                            </div>
                          )}
                          {paper.workflowCount > 0 ? (
                            <div className="flex items-center gap-1">
                              <Workflow className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span>Used in {paper.workflowCount} workflow{paper.workflowCount !== 1 ? 's' : ''}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <SearchIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span>Indexed from search</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>{paper.chunkCount} chunks</span>
                          </div>
                        </div>
                        {paper.topics.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {paper.topics.slice(0, 3).map((topic, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded"
                              >
                                {topic}
                              </span>
                            ))}
                            {paper.topics.length > 3 && (
                              <span className="px-2 py-1 text-xs font-medium bg-white/10 text-white/60 rounded">
                                +{paper.topics.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-white/40">
                          Source: {paper.source} • Indexed on {new Date(paper.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-shrink-0">
                        {paper.pdfUrl && (
                          <a
                            href={paper.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                          >
                            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            View PDF
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  )
}
