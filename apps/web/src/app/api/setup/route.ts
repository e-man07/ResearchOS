/**
 * Setup endpoint - creates test user
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Create test user if doesn't exist
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        id: 'temp-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      },
    })

    return NextResponse.json({
      message: 'Setup complete',
      user,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Setup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
