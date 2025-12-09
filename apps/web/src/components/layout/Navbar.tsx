'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Search, User, LogOut, LayoutDashboard, MessageSquare, Sparkles } from 'lucide-react'

export function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="bg-gray-950 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/chat" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">
              Research<span className="text-gray-400">OS</span>
            </h1>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {status === 'authenticated' ? (
              <>
                <Link
                  href="/chat"
                  className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors font-semibold"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium">AI Assistant</span>
                </Link>

                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="font-medium">Dashboard</span>
                </Link>

                {/* User Menu */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">{session.user?.name}</span>
                  </div>

                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/auth/signin"
                  className="text-gray-300 hover:text-white font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
