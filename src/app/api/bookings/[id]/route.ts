import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/bookings/[id] - Get a single booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Support lookup by ID or booking code
    const isNumericId = /^\d+$/.test(params.id)
    
    const booking = await prisma.booking.findFirst({
      where: isNumericId 
        ? { id: parseInt(params.id) }
        : { bookingCode: params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        court: {
          include: { courtType: true },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        review: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check ownership (unless admin)
    if (
      booking.userId !== parseInt(session.user.id) &&
      session.user.role !== 'admin'
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({
      booking: {
        ...booking,
        durationHours: Number(booking.durationHours),
        hourlyRate: Number(booking.hourlyRate),
        totalAmount: Number(booking.totalAmount),
        downpaymentAmount: Number(booking.downpaymentAmount),
        balanceAmount: Number(booking.balanceAmount),
        courtName: booking.court?.name,
        courtType: booking.court?.courtType?.name,
        courtLocation: booking.court?.location,
        courtCity: booking.court?.city,
        courtThumbnail: booking.court?.thumbnail,
        userName: booking.user?.name,
        userEmail: booking.user?.email,
        userPhone: booking.user?.phone,
        payments: booking.payments.map((p) => ({
          ...p,
          amount: Number(p.amount),
          refundAmount: p.refundAmount ? Number(p.refundAmount) : null,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 })
  }
}

// POST /api/bookings/[id]/cancel - Cancel a booking
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(params.id) },
      include: { court: true },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check ownership (unless admin)
    if (
      booking.userId !== parseInt(session.user.id) &&
      session.user.role !== 'admin'
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const data = await request.json()

    if (action === 'cancel') {
      if (booking.status === 'cancelled') {
        return NextResponse.json(
          { error: 'Booking is already cancelled' },
          { status: 400 }
        )
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: parseInt(params.id) },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: data.reason,
        },
      })

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: parseInt(session.user.id),
          action: 'booking_cancelled',
          description: `Booking ${booking.bookingCode} was cancelled`,
          entityType: 'booking',
          entityId: booking.id,
        },
      })

      return NextResponse.json(updatedBooking)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}
