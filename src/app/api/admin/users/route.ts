import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const filter = searchParams.get('filter') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '20')

    const where: any = {
      role: 'user',
    }

    // Apply filter
    if (filter === 'pending') {
      where.govIdType = { not: null }
      where.isActive = false
    } else if (filter === 'active') {
      where.isActive = true
      where.isBlacklisted = false
    } else if (filter === 'inactive') {
      where.isActive = false
    } else if (filter === 'blacklisted') {
      where.isBlacklisted = true
    }

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { email: { contains: query } },
        { phone: { contains: query } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          profileImage: true,
          isBlacklisted: true,
          blacklistReason: true,
          isActive: true,
          govIdType: true,
          govIdPhoto: true,
          facePhoto: true,
          createdAt: true,
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        bookingsCount: u._count.bookings,
      })),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/admin/users - Admin user actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, action, reason } = await request.json()

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let updatedUser

    switch (action) {
      case 'blacklist':
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            isBlacklisted: true,
            blacklistReason: reason,
          },
        })
        break

      case 'unblacklist':
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            isBlacklisted: false,
            blacklistReason: null,
          },
        })
        break

      case 'activate':
      case 'verify':
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            isActive: true,
          },
        })

        // Notify user
        await prisma.notification.create({
          data: {
            userId: userId,
            type: 'account_activated',
            title: 'Account Verified',
            message: 'Your account has been verified. You can now login and make bookings.',
            channel: 'web',
          },
        })
        break

      case 'deactivate':
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            isActive: false,
          },
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
