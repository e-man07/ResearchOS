'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Search, Workflow, MessageSquare, FileText, Zap, Brain, Database, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function LandingPage() {
  const { data: session } = useSession()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Research<span className="text-white/60">OS</span></span>
            </div>
            <div className="flex items-center gap-4">
              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/chat"
                    className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-medium text-sm"
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-medium text-sm"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-white/80">AI-Powered Research Assistant</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Your Autonomous
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Research Copilot
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl sm:text-2xl text-white/60 mb-12 leading-relaxed">
              Discover, analyze, and synthesize research papers with AI agents that work together
              to deliver comprehensive insights in minutes, not hours.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href={session ? "/chat" : "/auth/register"}
                className="group px-8 py-4 bg-white text-black rounded-lg hover:bg-white/90 transition-all font-semibold text-lg flex items-center gap-2 shadow-lg shadow-white/20"
              >
                Start Researching
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all font-semibold text-lg"
              >
                View Dashboard
              </Link>
            </div>

            {/* Scroll Indicator */}
            <div className="flex flex-col items-center gap-2 animate-bounce">
              <span className="text-sm text-white/40">Scroll to explore</span>
              <ChevronDown className="w-5 h-5 text-white/40" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Everything you need for
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                research at scale
              </span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Powerful AI agents working together to transform how you discover and understand research
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Smart Search</h3>
              <p className="text-white/60 leading-relaxed">
                Search across arXiv, Semantic Scholar, and more with intelligent query understanding
                and relevance ranking.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Workflow className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Multi-Agent Workflows</h3>
              <p className="text-white/60 leading-relaxed">
                Orchestrate multiple AI agents—planner, searcher, synthesizer, and reporter—to
                generate comprehensive research reports automatically.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">RAG-Powered Q&A</h3>
              <p className="text-white/60 leading-relaxed">
                Ask questions about your indexed papers and get accurate answers powered by
                retrieval-augmented generation with full source citations.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Vector Indexing</h3>
              <p className="text-white/60 leading-relaxed">
                Automatically chunk, embed, and index papers in Weaviate for lightning-fast semantic
                search and retrieval.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Conversational Interface</h3>
              <p className="text-white/60 leading-relaxed">
                Chat naturally with your research assistant. It remembers context, understands
                intent, and guides you through complex research tasks.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Export & Share</h3>
              <p className="text-white/60 leading-relaxed">
                Export research reports, share findings, and build on your work with comprehensive
                documentation and citations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Three simple steps to transform your research workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-400">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Search or Research</h3>
              <p className="text-white/60">
                Start by searching for papers or running a full research workflow. Our AI agents
                will find the most relevant papers for your topic.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-400">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Index & Analyze</h3>
              <p className="text-white/60">
                Papers are automatically indexed into our vector database, enabling semantic search
                and intelligent analysis across your research collection.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-400">3</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Ask & Explore</h3>
              <p className="text-white/60">
                Chat with your research assistant to ask questions, get summaries, compare
                approaches, and dive deep into any aspect of your research.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 rounded-3xl">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Ready to transform your research?
            </h2>
            <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
              Join researchers who are already using AI to accelerate their work and discover
              insights faster than ever before.
            </p>
            <Link
              href={session ? "/chat" : "/auth/register"}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-lg hover:bg-white/90 transition-all font-semibold text-lg shadow-lg shadow-white/20"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Research<span className="text-white/60">OS</span></span>
            </div>
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} ResearchOS. Built with AI for researchers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
