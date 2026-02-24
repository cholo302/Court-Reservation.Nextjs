import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/court-types - List all court types
export async function GET(request: NextRequest) {
  try {
    const courtTypes = await prisma.courtType.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ courtTypes })
  } catch (error) {
    console.error('Error fetching court types:', error)
    return NextResponse.json({ error: 'Failed to fetch court types' }, { status: 500 })
  }
}
