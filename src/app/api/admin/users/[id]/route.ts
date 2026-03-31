export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/admin/users/[id] - Admin user actions
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const data = await request.json().catch(() => ({}))

    const user = await prisma.user.findUnique({
      where: { id: parseInt(params.id) },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let updatedUser

    switch (action) {
      case 'blacklist':
        updatedUser = await prisma.user.update({
          where: { id: parseInt(params.id) },
          data: {
            isBlacklisted: true,
            blacklistReason: data.reason,
          },
        })
        break

      case 'unblacklist':
        updatedUser = await prisma.user.update({
          where: { id: parseInt(params.id) },
          data: {
            isBlacklisted: false,
            blacklistReason: null,
          },
        })
        break

      case 'activate':
        updatedUser = await prisma.user.update({
          where: { id: parseInt(params.id) },
          data: {
            isActive: true,
          },
        })

        // Notify user
        await prisma.notification.create({
          data: {
            userId: parseInt(params.id),
            type: 'account_activated',
            title: 'Account Verified',
            message: 'Your account has been verified. You can now login and make bookings.',
            channel: 'web',
          },
        })
        break

      case 'deactivate':
        updatedUser = await prisma.user.update({
          where: { id: parseInt(params.id) },
          data: {
            isActive: false,
          },
        })
        break

      case 'delete':
        // Prevent admin from deleting their own account
        if (parseInt(params.id) === parseInt(session.user.id)) {
          return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 400 })
        }
        const userId = parseInt(params.id)
        
        // Delete all related records in a transaction with proper order
        await prisma.$transaction(async (tx) => {
          // 1. Get all booking IDs for this user
          const userBookings = await tx.booking.findMany({
            where: { userId },
            select: { id: true },
          })
          const bookingIds = userBookings.map((b) => b.id)

          // 2. Delete payments linked to those bookings
          if (bookingIds.length > 0) {
            await tx.payment.deleteMany({ where: { bookingId: { in: bookingIds } } })
          }

          // 3. Delete notifications
          await tx.notification.deleteMany({ where: { userId } })

          // 4. Delete reviews
          await tx.review.deleteMany({ where: { userId } })

          // 5. Delete bookings
          await tx.booking.deleteMany({ where: { userId } })

          // 6. Delete activity logs
          await tx.activityLog.deleteMany({ where: { userId } })

          // 7. Delete password resets
          await tx.passwordReset.deleteMany({ where: { email: user.email } })

          // 8. Finally delete the user
          await tx.user.delete({ where: { id: userId } })
        })

        return NextResponse.json({ message: 'User deleted successfully' })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Log activity (commented out until migrations are run)
    // await prisma.activityLog.create({
    //   data: {
    //     userId: parseInt(session.user.id),
    //     action: `user_${action}`,
    //     description: `User ${user.email} was ${action}ed by admin`,
    //     entityType: 'user',
    //     entityId: user.id,
    //   },
    // })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
