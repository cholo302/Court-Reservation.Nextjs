export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  // Check for email query parameter (for resubmit flow - public)
  const { searchParams } = new URL(req.url)
  const userEmail = searchParams.get('email')
  
  if (userEmail) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          govIdType: true,
        },
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      console.log('Profile API: User found:', user.id)
      return NextResponse.json(user, { status: 200 })
    } catch (error) {
      console.error('Profile API: Error fetching user:', error)
      return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 })
    }
  }

  // Regular authenticated profile fetch
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
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        phone: true,
        profileImage: true,
        facePhoto: true,
        govIdType: true,
        createdAt: true,
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
        .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0),
    }

    const preferences = { sms: true, email: true }

    return NextResponse.json({
      user: {
        ...user,
        avatar: user.profileImage || user.facePhoto,
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
    const { firstName, middleName, lastName, phone } = body

    const name = [firstName, middleName, lastName].filter(Boolean).join(' ')

    const user = await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: {
        name,
        firstName: firstName || '',
        middleName: middleName || null,
        lastName: lastName || '',
        phone,
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        middleName: true,
        lastName: true,
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

