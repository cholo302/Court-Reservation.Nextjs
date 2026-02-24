import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateBookingCode, RESERVATION_EXPIRY_MINUTES } from '@/lib/utils'

// GET /api/bookings - List user's bookings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '10')

    const where: any = {
      userId: parseInt(session.user.id),
    }

    if (status) {
      where.status = status
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          court: {
            include: {
              courtType: true,
            },
          },
        },
        orderBy: { bookingDate: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.booking.count({ where }),
    ])

    const bookingsWithDetails = bookings.map((booking) => ({
      ...booking,
      durationHours: Number(booking.durationHours),
      hourlyRate: Number(booking.hourlyRate),
      totalAmount: Number(booking.totalAmount),
      downpaymentAmount: Number(booking.downpaymentAmount),
      balanceAmount: Number(booking.balanceAmount),
      courtName: booking.court?.name,
      courtType: booking.court?.courtType?.name,
      thumbnail: booking.court?.thumbnail,
    }))

    return NextResponse.json({
      bookings: bookingsWithDetails,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)

    // Check if user is blacklisted
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.isBlacklisted) {
      return NextResponse.json(
        { error: 'Your account is suspended and cannot make bookings' },
        { status: 403 }
      )
    }

    const data = await request.json()

    // Validate required fields
    if (!data.courtId || !data.bookingDate || !data.startTime || !data.endTime) {
      return NextResponse.json(
        { error: 'courtId, bookingDate, startTime, and endTime are required' },
        { status: 400 }
      )
    }

    const court = await prisma.court.findUnique({
      where: { id: data.courtId },
    })

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    // Check availability
    const existingBooking = await prisma.booking.findFirst({
      where: {
        courtId: data.courtId,
        bookingDate: new Date(data.bookingDate),
        status: { notIn: ['cancelled', 'expired'] },
        OR: [
          {
            AND: [
              { startTime: { lte: data.startTime } },
              { endTime: { gt: data.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: data.endTime } },
              { endTime: { gte: data.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: data.startTime } },
              { endTime: { lte: data.endTime } },
            ],
          },
        ],
      },
    })

    if (existingBooking) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409 }
      )
    }

    // Calculate duration and price
    const startHour = parseInt(data.startTime.split(':')[0])
    const endHour = parseInt(data.endTime.split(':')[0])
    const durationHours = endHour - startHour

    const hourlyRate = Number(court.hourlyRate)
    const totalAmount = durationHours * hourlyRate
    const downpaymentAmount = Math.ceil(totalAmount * (court.downpaymentPercent / 100))
    const balanceAmount = totalAmount - downpaymentAmount

    // Generate booking code and QR code
    const bookingCode = generateBookingCode()

    // Set expiry for pay-at-venue reservations
    let expiresAt = null
    if (data.paymentType === 'venue') {
      expiresAt = new Date(Date.now() + RESERVATION_EXPIRY_MINUTES * 60 * 1000)
    }

    const booking = await prisma.booking.create({
      data: {
        bookingCode,
        userId,
        courtId: data.courtId,
        bookingDate: new Date(data.bookingDate),
        startTime: data.startTime,
        endTime: data.endTime,
        durationHours,
        isHalfCourt: data.isHalfCourt || false,
        hourlyRate,
        totalAmount,
        downpaymentAmount,
        balanceAmount,
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentType: data.paymentType || 'online',
        playerCount: data.playerCount,
        notes: data.notes,
        expiresAt,
        entryQrCode: bookingCode, // Will be generated properly later
      },
      include: {
        court: {
          include: { courtType: true },
        },
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'booking_created',
        description: `New booking created for ${court.name}`,
        entityType: 'booking',
        entityId: booking.id,
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'booking_created',
        title: 'Booking Created',
        message: `Your booking for ${court.name} on ${data.bookingDate} has been created. Please complete payment.`,
        data: JSON.stringify({ bookingId: booking.id }),
        channel: 'web',
      },
    })

    return NextResponse.json(
      {
        booking: {
          ...booking,
          durationHours: Number(booking.durationHours),
          hourlyRate: Number(booking.hourlyRate),
          totalAmount: Number(booking.totalAmount),
          downpaymentAmount: Number(booking.downpaymentAmount),
          balanceAmount: Number(booking.balanceAmount),
          courtName: booking.court?.name,
          courtType: booking.court?.courtType?.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}
