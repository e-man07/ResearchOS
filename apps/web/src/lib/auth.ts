/**
 * NextAuth configuration
 */

import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error('Missing credentials')
            return null
          }

          console.log('Attempting to find user:', credentials.email)

          const user = await prisma.user.findUnique({
            where: { email: String(credentials.email) },
          })

          if (!user) {
            console.error('User not found:', credentials.email)
            return null
          }

          if (!user.passwordHash) {
            console.error('User has no password hash')
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            String(credentials.password),
            user.passwordHash
          )

          if (!isPasswordValid) {
            console.error('Invalid password')
            return null
          }

          if (!user.isActive) {
            console.error('User account is inactive')
            return null
          }

          console.log('Authentication successful for:', user.email)

          return {
            id: user.id,
            email: user.email,
            name: user.name || '',
            role: user.role,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
