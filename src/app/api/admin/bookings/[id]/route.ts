import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/admin/bookings/[id] - Admin booking actions
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

    // Support lookup by ID or booking code
    const isNumericId = /^\d+$/.test(params.id)
    
    const booking = await prisma.booking.findFirst({
      where: isNumericId 
        ? { id: parseInt(params.id) }
        : { bookingCode: params.id },
      include: { court: true, user: true },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    let updatedBooking

    switch (action) {
      case 'confirm':
        updatedBooking = await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: 'confirmed',
            confirmedAt: new Date(),
            adminNotes: data.adminNotes,
          },
        })

        // Create notification for user
        await prisma.notification.create({
          data: {
            userId: booking.userId,
            type: 'booking_confirmed',
            title: 'Booking Confirmed',
            message: `Your booking for ${booking.court?.name} has been confirmed.`,
            data: JSON.stringify({ bookingId: booking.id }),
            channel: 'web',
          },
        })
        break

      case 'cancel':
        updatedBooking = await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancellationReason: data.reason || 'Cancelled by admin',
          },
        })

        await prisma.notification.create({
          data: {
            userId: booking.userId,
            type: 'booking_cancelled',
            title: 'Booking Cancelled',
            message: `Your booking for ${booking.court?.name} has been cancelled. Reason: ${data.reason || 'N/A'}`,
            data: JSON.stringify({ bookingId: booking.id }),
            channel: 'web',
          },
        })
        break

      case 'complete':
        updatedBooking = await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: 'completed',
          },
        })
        break

      case 'no-show':
        updatedBooking = await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: 'no_show',
          },
        })

        await prisma.notification.create({
          data: {
            userId: booking.userId,
            type: 'booking_no_show',
            title: 'Marked as No-Show',
            message: `You were marked as no-show for your booking at ${booking.court?.name}.`,
            data: JSON.stringify({ bookingId: booking.id }),
            channel: 'web',
          },
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Log activity (commented out until migrations are run)
    // await prisma.activityLog.create({
    //   data: {
    //     userId: parseInt(session.user.id),
    //     action: `booking_${action}`,
    //     description: `Booking ${booking.bookingCode} was ${action}ed by admin`,
    //     entityType: 'booking',
    //     entityId: booking.id,
    //   },
    // })

    return NextResponse.json({
      ...updatedBooking,
      totalAmount: Number(updatedBooking.totalAmount),
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}
