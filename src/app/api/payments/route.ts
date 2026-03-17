import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generatePaymentReference } from '@/lib/utils'

// GET /api/payments - List user's payments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = session.user.role === 'admin'
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}

    if (!isAdmin) {
      where.userId = parseInt(session.user.id)
    }

    if (status) {
      where.status = status
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            court: true,
          },
        },
        user: {
          select: { 
            id: true, 
            name: true, 
            email: true,
            profileImage: true,
            facePhoto: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
        refundAmount: p.refundAmount ? Number(p.refundAmount) : null,
        bookingCode: p.booking?.bookingCode,
        bookingDate: p.booking?.bookingDate,
        courtName: p.booking?.court?.name,
        userName: p.user?.name,
        userEmail: p.user?.email,
        userAvatar: p.user?.profileImage || p.user?.facePhoto || null,
        proofScreenshot: p.proofScreenshot,
        transactionId: p.transactionId,
      }))
    )
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

// POST /api/payments - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    if (!data.bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check ownership
    if (booking.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (booking.paymentStatus === 'paid') {
      return NextResponse.json(
        { error: 'This booking is already paid' },
        { status: 400 }
      )
    }

    const amount = data.paymentType === 'full' 
      ? Number(booking.totalAmount) 
      : Number(booking.downpaymentAmount)

    const payment = await prisma.payment.create({
      data: {
        paymentReference: generatePaymentReference(),
        bookingId: data.bookingId,
        userId: parseInt(session.user.id),
        amount,
        paymentMethod: data.paymentMethod || 'gcash',
        paymentType: data.paymentType || 'downpayment',
        status: 'pending',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
      },
    })

    return NextResponse.json(
      {
        payment: {
          ...payment,
          amount: Number(payment.amount),
          referenceNumber: payment.paymentReference,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
