export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

// POST /api/court-types - Create a new court type (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Court type name is required' }, { status: 400 })
    }

    const trimmed = name.trim()
    const slug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Check for existing slug, append suffix if needed
    let uniqueSlug = slug
    const existing = await prisma.courtType.findUnique({ where: { slug } })
    if (existing) {
      uniqueSlug = `${slug}-${Date.now()}`
    }

    const courtType = await prisma.courtType.create({
      data: { name: trimmed, slug: uniqueSlug },
    })

    return NextResponse.json({ courtType }, { status: 201 })
  } catch (error) {
    console.error('Error creating court type:', error)
    return NextResponse.json({ error: 'Failed to create court type' }, { status: 500 })
  }
}

