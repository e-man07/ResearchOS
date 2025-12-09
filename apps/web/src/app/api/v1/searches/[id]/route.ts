/**
 * API route: /api/v1/searches/[id]
 * Get search by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const search = await prisma.search.findUnique({
      where: { id: params.id },
    })

    if (!search) {
      return NextResponse.json(
        { error: 'Search not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(search)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
