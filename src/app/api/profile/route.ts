import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        createdAt: true,
        preferences: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get booking stats
    const bookings = await prisma.booking.findMany({
      where: { userId: user.id },
      select: {
        status: true,
        totalAmount: true,
      },
    })

    const stats = {
      totalBookings: bookings.length,
      completed: bookings.filter((b) => b.status === 'completed').length,
      totalSpent: bookings
        .filter((b) => ['paid', 'completed'].includes(b.status))
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    }

    // Parse preferences
    let preferences = { sms: true, email: true }
    if (user.preferences) {
      try {
        preferences = typeof user.preferences === 'string'
          ? JSON.parse(user.preferences)
          : user.preferences as { sms: boolean; email: boolean }
      } catch (e) {
        // Use default
      }
    }

    return NextResponse.json({
      user: {
        ...user,
        preferences,
      },
      stats,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, phone } = body

    const user = await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: {
        name,
        phone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
