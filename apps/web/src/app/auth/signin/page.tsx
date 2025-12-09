'use client'

import { useState, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LogIn, Loader2 } from 'lucide-react'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(undefined)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      console.log('Sign in result:', result)

      if (result?.error) {
        setError('Invalid email or password')
        setIsLoading(false)
      } else if (result?.ok) {
        // Wait a moment for the session to be set in cookies
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Verify session is available
        const session = await getSession()
        if (!session) {
          // If session not available yet, wait a bit more and try again
          await new Promise(resolve => setTimeout(resolve, 300))
        }
        
        // Get callback URL from query params or default to /chat
        const callbackUrl = searchParams.get('callbackUrl') || '/chat'
        
        // Decode the callback URL if it's encoded
        let decodedCallbackUrl = callbackUrl
        if (callbackUrl.startsWith('http')) {
          try {
            decodedCallbackUrl = new URL(callbackUrl).pathname
          } catch {
            decodedCallbackUrl = '/chat'
          }
        } else {
          try {
            decodedCallbackUrl = decodeURIComponent(callbackUrl)
          } catch {
            decodedCallbackUrl = callbackUrl
          }
        }
        
        // Ensure the path starts with /
        if (!decodedCallbackUrl.startsWith('/')) {
          decodedCallbackUrl = '/' + decodedCallbackUrl
        }
        
        // Use window.location for hard redirect to ensure session is loaded
        window.location.href = decodedCallbackUrl
      }
    } catch (err) {
      console.error('Sign in error:', err)
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative">
      {/* Subtle background glow effect */}
      <div className="fixed inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Research<span className="text-white/60">OS</span>
          </h1>
          <p className="text-white/70">Sign in to your account</p>
        </div>

        {/* Form */}
        <div className="bg-black/80 backdrop-blur-sm border border-white/10 p-8 rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:border-white/30 focus:outline-none text-white placeholder:text-white/40 transition-colors"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:border-white/30 focus:outline-none text-white placeholder:text-white/40 transition-colors"
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center text-sm text-white/70">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/register"
              className="text-white hover:text-white/80 font-medium transition-colors"
            >
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
