export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/bookings/[id]/confirm-payment - Confirm balance payment collected at venue
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
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.paymentType !== 'venue') {
      return NextResponse.json({ error: 'This booking is not a downpayment booking' }, { status: 400 })
    }

    // Update payment status from 'downpayment' to 'paid'
    let paymentUpdated = false
    if (booking.payments.length > 0) {
      const payment = booking.payments[0]
      
      if (payment.status === 'downpayment') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'paid',
            paidAt: new Date(),
          },
        })
        paymentUpdated = true
      }
    }

    if (!paymentUpdated) {
      return NextResponse.json({ error: 'No downpayment found to confirm' }, { status: 400 })
    }

    // Update booking payment status to fully paid
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: 'paid',
      },
    })

    // Notify user that balance payment was confirmed
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: 'payment_confirmed',
        title: 'Balance Payment Confirmed',
        message: `Your balance payment for ${booking.court?.name} has been confirmed. You're all set!`,
        data: JSON.stringify({ bookingId: booking.id }),
        channel: 'web',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Balance payment confirmed',
      paymentStatus: 'paid',
      totalAmount: Number(updatedBooking.totalAmount),
    })
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 })
  }
}
