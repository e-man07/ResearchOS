'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.'
      case 'Verification':
        return 'The verification token has expired or has already been used.'
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'EmailCreateAccount':
      case 'Callback':
        return 'Error in the authentication process. Please try again.'
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another account.'
      case 'EmailSignin':
        return 'The email could not be sent.'
      case 'CredentialsSignin':
        return 'Invalid email or password. Please check your credentials.'
      case 'SessionRequired':
        return 'Please sign in to access this page.'
      default:
        return 'An error occurred during authentication. Please try again.'
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
          <p className="text-white/70">Authentication Error</p>
        </div>

        {/* Error Card */}
        <div className="bg-black/80 backdrop-blur-sm border border-white/10 p-8 rounded-lg">
          <div className="flex items-start gap-4 mb-6">
            <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Authentication Failed
              </h2>
              <p className="text-white/70">{getErrorMessage(error)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="block w-full px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-colors text-center"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="block w-full px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors text-center border border-white/10"
            >
              Go Home
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-white/70">
            Need help?{' '}
            <Link href="/auth/register" className="text-white hover:text-white/80 font-medium transition-colors">
              Create a new account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}
