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

      const updatedPayment = await prisma.payment.update({
        where: { paymentReference: params.ref },
        data: {
          status: 'paid',
          verifiedBy: parseInt(session.user.id),
          verifiedAt: new Date(),
          paidAt: new Date(),
        },
      })

      // Update booking status
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: 'confirmed',
          paymentStatus: 'paid',
          paidAt: new Date(),
          confirmedAt: new Date(),
        },
      })

      // Log activity (commented out until migrations are run)
      // await prisma.activityLog.create({
      //   data: {
      //     userId: parseInt(session.user.id),
      //     action: 'payment_verified',
      //     description: `Payment ${params.ref} verified`,
      //     entityType: 'payment',
      //     entityId: payment.id,
      //   },
      // })

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
