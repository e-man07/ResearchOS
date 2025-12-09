/**
 * Middleware for protected routes
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  // Skip middleware for API routes and static files
  if (request.nextUrl.pathname.startsWith('/api/') || 
      request.nextUrl.pathname.startsWith('/_next/') ||
      request.nextUrl.pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // Get token - getToken will automatically detect the correct cookie name
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  // If no token and trying to access protected route, redirect to signin
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url)
    // Set callbackUrl to just the pathname (not full URL) to avoid encoding issues
    signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

// Protect these routes
// Note: Dashboard is handled client-side for better redirect flow after sign-in
export const config = {
  matcher: [
    '/search/:path*',
    '/projects/:path*',
  ],
}
