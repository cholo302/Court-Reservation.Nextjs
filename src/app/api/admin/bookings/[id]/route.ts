import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/admin/bookings/[id] - Get booking details
export async function GET(
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
        court: { include: { courtType: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({
      booking: {
        ...booking,
        totalAmount: Number(booking.totalAmount),
        downpaymentAmount: Number(booking.downpaymentAmount),
        balanceAmount: Number(booking.balanceAmount),
        hourlyRate: Number(booking.hourlyRate),
        durationHours: Number(booking.durationHours),
        courtName: booking.court?.name,
        courtType: booking.court?.courtType?.name,
        userName: booking.user?.name,
        userEmail: booking.user?.email,
        userPhone: booking.user?.phone,
      },
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 })
  }
}

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

        await prisma.notification.create({
          data: {
            userId: booking.userId,
            type: 'booking_completed',
            title: 'Booking Completed',
            message: `Your booking for ${booking.court?.name} has been marked as completed. Thank you for playing!`,
            data: JSON.stringify({ bookingId: booking.id }),
            channel: 'web',
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

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: `booking_${action}`,
        description: `Booking ${booking.bookingCode} was ${action}ed by admin`,
        entityType: 'booking',
        entityId: booking.id,
      },
    })

    return NextResponse.json({
      ...updatedBooking,
      totalAmount: Number(updatedBooking.totalAmount),
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}
