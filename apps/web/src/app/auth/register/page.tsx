'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(undefined)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
      } else {
        // Redirect to sign in
        router.push('/auth/signin?registered=true')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
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
          <p className="text-white/70">Create your account</p>
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

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                minLength={2}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:border-white/30 focus:outline-none text-white placeholder:text-white/40 transition-colors"
                disabled={isLoading}
              />
            </div>

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
                minLength={8}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:border-white/30 focus:outline-none text-white placeholder:text-white/40 transition-colors"
                disabled={isLoading}
              />
              <p className="text-xs text-white/50 mt-1">
                At least 8 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
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
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center text-sm text-white/70">
            Already have an account?{' '}
            <Link
              href="/auth/signin"
              className="text-white hover:text-white/80 font-medium transition-colors"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
