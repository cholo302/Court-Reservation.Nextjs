export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/bookings/[id]/check-out - Check out a booking (players are done)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Support lookup by ID or booking code
    const isNumericId = /^\d+$/.test(params.id)

    const booking = await prisma.booking.findFirst({
      where: isNumericId
        ? { id: parseInt(params.id) }
        : { bookingCode: params.id },
      include: {
        court: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Only completed (checked-in) bookings can be checked out
    if (booking.status !== 'completed') {
      return NextResponse.json(
        { error: 'Cannot check out: booking has not been checked in yet.' },
        { status: 400 }
      )
    }

    // Prevent double checkout
    if (booking.checkedOutAt) {
      return NextResponse.json(
        { error: 'This booking has already been checked out.' },
        { status: 400 }
      )
    }

    // Update booking with checkout timestamp
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        checkedOutAt: new Date(),
      },
    })

    // Notify user of checkout
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: 'booking_checked_out',
        title: 'Checked Out',
        message: `Your session at ${booking.court?.name} has ended. Thank you for playing!`,
        data: JSON.stringify({ bookingId: booking.id }),
        channel: 'web',
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'check_out',
        description: `Booking ${booking.bookingCode} checked out from ${booking.court?.name}`,
        entityType: 'booking',
        entityId: booking.id,
      },
    })

    return NextResponse.json({
      ...updatedBooking,
      totalAmount: Number(updatedBooking.totalAmount),
      message: 'Check-out successful',
    })
  } catch (error) {
    console.error('Error checking out booking:', error)
    return NextResponse.json({ error: 'Failed to check out booking' }, { status: 500 })
  }
}
