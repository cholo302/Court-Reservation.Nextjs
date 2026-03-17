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
      where.govIdPhoto = { not: null }
      where.isIdVerified = false
    } else if (filter === 'verified') {
      where.isIdVerified = true
    } else if (filter === 'not_verified') {
      where.isIdVerified = false
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
          isIdInvalid: true,
          isIdVerified: true,
          govIdType: true,
          govIdPhoto: true,
          govIdNumber: true,
          govIdName: true,
          govIdBirthdate: true,
          govIdExpiry: true,
          govIdAddress: true,
          facePhoto: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { bookings: true },
          },
          activityLogs: {
            where: { action: 'resubmit_documents' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
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
        hasResubmittedDocs: u.activityLogs.length > 0 && !u.isIdVerified,
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

      case 'not_valid_id':
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            isIdInvalid: true,
            isIdVerified: false,
          },
        })

        // Clear resubmit activity logs (removes "New" badge)
        await prisma.activityLog.deleteMany({
          where: { userId, action: 'resubmit_documents' },
        })

        // Notify user
        await prisma.notification.create({
          data: {
            userId: userId,
            type: 'id_invalid',
            title: 'ID Verification Failed',
            message: 'Your government ID or selfie was found to be invalid. Please upload valid documents to continue using our service.',
            channel: 'web',
          },
        })
        break

      case 'valid_id':
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            isIdInvalid: false,
          },
        })

        // Notify user
        await prisma.notification.create({
          data: {
            userId: userId,
            type: 'id_valid',
            title: 'ID Verification Approved',
            message: 'Your government ID and selfie have been approved. You can now login and use our service.',
            channel: 'web',
          },
        })
        break

      case 'verify_id':
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            isIdVerified: true,
            isIdInvalid: false,
          },
        })

        // Clear resubmit activity logs (removes "New" badge)
        await prisma.activityLog.deleteMany({
          where: { userId, action: 'resubmit_documents' },
        })

        // Notify user
        await prisma.notification.create({
          data: {
            userId: userId,
            type: 'id_verified',
            title: 'ID Verified',
            message: 'Your government ID has been verified! You can now book courts.',
            channel: 'web',
          },
        })
        break

      case 'unverify_id':
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            isIdVerified: false,
            isIdInvalid: true,
          },
        })

        // Notify user
        await prisma.notification.create({
          data: {
            userId: userId,
            type: 'id_unverified',
            title: 'ID Verification Revoked',
            message: 'Your ID verification has been revoked. Please re-submit your documents.',
            channel: 'web',
          },
        })
        break

      case 'request_resubmit':
        // Notify user to resubmit documents
        const resubmitMessage = reason
          ? `Your documents were not accepted. Reason: ${reason}. Please resubmit your government ID and selfie photo.`
          : 'Please resubmit your government ID and selfie photo.'

        await prisma.notification.create({
          data: {
            userId: userId,
            type: 'documents_resubmit',
            title: 'Resubmit Your Documents',
            message: resubmitMessage,
            channel: 'web',
          },
        })

        updatedUser = user
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Log admin action
    const actionDescriptions: Record<string, string> = {
      blacklist: `User ${user.email} was blacklisted`,
      unblacklist: `User ${user.email} was removed from blacklist`,
      not_valid_id: `User ${user.email}'s ID was marked as invalid`,
      valid_id: `User ${user.email}'s ID was marked as valid`,
      verify_id: `User ${user.email}'s ID was verified`,
      unverify_id: `User ${user.email}'s ID verification was revoked`,
      request_resubmit: `User ${user.email} was asked to resubmit documents`,
    }

    await prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: action,
        description: actionDescriptions[action] || `Admin action: ${action} on user ${user.email}`,
        entityType: 'user',
        entityId: userId,
      },
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
