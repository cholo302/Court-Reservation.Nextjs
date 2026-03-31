export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generatePaymentReference } from '@/lib/utils'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const proof = formData.get('proof') as File | null
    const referenceNumber = formData.get('referenceNumber') as string
    const bookingId = formData.get('bookingId') as string
    const amount = formData.get('amount') as string

    if (!proof) {
      return NextResponse.json({ error: 'Payment proof is required' }, { status: 400 })
    }

    if (!referenceNumber) {
      return NextResponse.json({ error: 'Reference number is required' }, { status: 400 })
    }

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    // Look up the booking
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check ownership
    if (booking.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (booking.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'This booking is already paid' }, { status: 400 })
    }

    // Booking must be confirmed before payment
    if (booking.status !== 'confirmed') {
      return NextResponse.json({ error: 'Booking must be confirmed before payment can be submitted' }, { status: 400 })
    }

    // Save the proof image
    const bytes = await proof.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const ext = path.extname(proof.name) || '.jpg'
    const filename = `proof-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`

    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'proofs')
    await mkdir(uploadDir, { recursive: true })

    // Write file
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    const proofUrl = `/uploads/proofs/${filename}`

    // Create payment record with proof
    const paymentRef = generatePaymentReference()
    const paymentAmount = amount ? parseFloat(amount) : Number(booking.totalAmount)

    // Determine payment type based on booking's payment type
    const isDownpayment = booking.paymentType === 'venue'

    const payment = await prisma.payment.create({
      data: {
        paymentReference: paymentRef,
        bookingId: parseInt(bookingId),
        userId: parseInt(session.user.id),
        amount: paymentAmount,
        paymentMethod: 'gcash',
        paymentType: isDownpayment ? 'downpayment' : 'full',
        status: 'processing',
        proofScreenshot: proofUrl,
        transactionId: referenceNumber,
      },
    })

    // Update booking paymentStatus to show payment is being processed (keep status as confirmed)
    await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: {
        paymentStatus: 'processing',
      },
    })

    // Log activity
    const bookingWithCourt = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: { court: true },
    })

    await prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'payment_submitted',
        description: `Payment proof submitted for ${bookingWithCourt?.court?.name || 'booking'} (₱${paymentAmount.toFixed(2)})`,
        entityType: 'payment',
        entityId: payment.id,
      },
    })

    // Notify the user that their payment was submitted
    await prisma.notification.create({
      data: {
        userId: parseInt(session.user.id),
        type: 'payment_submitted',
        title: 'Payment Submitted',
        message: `Your payment of ₱${paymentAmount.toFixed(2)} for ${bookingWithCourt?.court?.name || 'your booking'} has been submitted and is awaiting admin verification.`,
        data: JSON.stringify({ bookingId: parseInt(bookingId), paymentId: payment.id }),
        channel: 'web',
      },
    })

    // Notify all admins about the new payment
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true },
    })

    await Promise.all(
      admins.map((admin) =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'payment_received',
            title: 'New Payment Received',
            message: `${session.user.name || 'A user'} submitted payment of ₱${paymentAmount.toFixed(2)} for ${bookingWithCourt?.court?.name || 'a booking'}. Please review and verify.`,
            data: JSON.stringify({ bookingId: parseInt(bookingId), paymentId: payment.id }),
            channel: 'web',
          },
        })
      )
    )

    return NextResponse.json(
      {
        message: 'Payment proof uploaded successfully',
        payment: {
          ...payment,
          amount: Number(payment.amount),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error uploading payment proof:', error)
    return NextResponse.json({ error: 'Failed to upload payment proof' }, { status: 500 })
  }
}

