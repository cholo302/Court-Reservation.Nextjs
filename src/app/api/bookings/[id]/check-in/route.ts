import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/bookings/[id]/check-in - Check in for a booking (mark as completed)
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
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Ensure payment is fully settled before check-in
    if (booking.paymentStatus !== 'paid') {
      return NextResponse.json(
        { error: 'Cannot check in: payment is not fully settled. Please confirm balance payment first.' },
        { status: 400 }
      )
    }

    // Update booking status to completed
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'completed',
      },
    })

    return NextResponse.json({
      ...updatedBooking,
      totalAmount: Number(updatedBooking.totalAmount),
      message: 'Check-in successful',
    })
  } catch (error) {
    console.error('Error checking in booking:', error)
    return NextResponse.json({ error: 'Failed to check in booking' }, { status: 500 })
  }
}
