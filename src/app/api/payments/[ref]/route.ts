export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/payments/[ref]/status - Get payment status
export async function GET(
  request: NextRequest,
  { params }: { params: { ref: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payment = await prisma.payment.findUnique({
      where: { paymentReference: params.ref },
      include: {
        booking: {
          include: { court: true },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Check ownership (unless admin)
    if (
      payment.userId !== parseInt(session.user.id) &&
      session.user.role !== 'admin'
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({
      ...payment,
      amount: Number(payment.amount),
      refundAmount: payment.refundAmount ? Number(payment.refundAmount) : null,
      bookingCode: payment.booking?.bookingCode,
      courtName: payment.booking?.court?.name,
    })
  } catch (error) {
    console.error('Error fetching payment:', error)
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 })
  }
}

// POST /api/payments/[ref] - Update payment (upload proof, verify, etc.)
export async function POST(
  request: NextRequest,
  { params }: { params: { ref: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const data = await request.json()

    const payment = await prisma.payment.findUnique({
      where: { paymentReference: params.ref },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (action === 'upload-proof') {
      // Check ownership
      if (payment.userId !== parseInt(session.user.id)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Only allow proof upload for pending payments
      if (payment.status !== 'pending') {
        return NextResponse.json({ error: 'Proof can only be uploaded for pending payments' }, { status: 400 })
      }

      const updatedPayment = await prisma.payment.update({
        where: { paymentReference: params.ref },
        data: {
          proofScreenshot: data.proofScreenshot,
          status: 'processing',
        },
      })

      return NextResponse.json({
        ...updatedPayment,
        amount: Number(updatedPayment.amount),
      })
    }

    if (action === 'verify' && session.user.role === 'admin') {
      if (payment.status !== 'pending' && payment.status !== 'processing') {
        return NextResponse.json(
          { error: 'Payment is not in a verifiable state' },
          { status: 400 }
        )
      }

      // Get booking to check if it's a downpayment
      const booking = await prisma.booking.findUnique({
        where: { id: payment.bookingId },
      })

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      // For downpayment bookings, set payment status to 'downpayment'
      // For full payment bookings, set payment status to 'paid'
      const isDownpayment = booking.paymentType === 'venue'
      const paymentStatus = isDownpayment ? 'downpayment' : 'paid'

      const updatedPayment = await prisma.payment.update({
        where: { paymentReference: params.ref },
        data: {
          status: paymentStatus,
          verifiedBy: parseInt(session.user.id),
          verifiedAt: new Date(),
          paidAt: new Date(),
        },
      })

      // Update booking payment status (booking is already confirmed by admin)
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus,
          paidAt: new Date(),
        },
      })

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: parseInt(session.user.id),
          action: 'payment_verified',
          description: `Payment ${params.ref} verified`,
          entityType: 'payment',
          entityId: payment.id,
        },
      })

      // Notify user that payment was verified
      const verifiedBooking = await prisma.booking.findUnique({
        where: { id: payment.bookingId },
        include: { court: true },
      })

      await prisma.notification.create({
        data: {
          userId: payment.userId,
          type: 'payment_verified',
          title: 'Payment Verified',
          message: `Your payment for ${verifiedBooking?.court?.name || 'your booking'} has been verified. ${isDownpayment ? 'Please pay the remaining balance at the venue.' : 'You\'re all set!'}`,
          data: JSON.stringify({ bookingId: payment.bookingId }),
          channel: 'web',
        },
      })

      return NextResponse.json({
        ...updatedPayment,
        amount: Number(updatedPayment.amount),
      })
    }

    if (action === 'reject' && session.user.role === 'admin') {
      const updatedPayment = await prisma.payment.update({
        where: { paymentReference: params.ref },
        data: {
          status: 'rejected',
          verifiedBy: parseInt(session.user.id),
          verifiedAt: new Date(),
        },
      })

      // Cancel booking
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: data.reason || 'Payment rejected',
        },
      })

      // Notify user that payment was rejected
      const rejectedBooking = await prisma.booking.findUnique({
        where: { id: payment.bookingId },
        include: { court: true },
      })

      await prisma.notification.create({
        data: {
          userId: payment.userId,
          type: 'payment_rejected',
          title: 'Payment Rejected',
          message: `Your payment for ${rejectedBooking?.court?.name || 'your booking'} was rejected. ${data.reason ? `Reason: ${data.reason}` : 'Please contact support for more details.'}`,
          data: JSON.stringify({ bookingId: payment.bookingId }),
          channel: 'web',
        },
      })

      return NextResponse.json({
        ...updatedPayment,
        amount: Number(updatedPayment.amount),
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}
