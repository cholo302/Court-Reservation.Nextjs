import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateBookingCode, RESERVATION_EXPIRY_MINUTES } from '@/lib/utils'

// Helper to get a setting from DB with a default fallback
async function getSetting(key: string, defaultValue: string): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } })
  return row?.value ?? defaultValue
}

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

    // Handle special case for 'paid' filter - filter by payment status instead of booking status
    let paymentStatusFilter: any = undefined
    if (status === 'paid') {
      paymentStatusFilter = {
        payments: {
          some: {
            status: 'paid',
          },
        },
      }
    } else if (status === 'downpayment') {
      paymentStatusFilter = {
        payments: {
          some: {
            status: 'downpayment',
          },
        },
      }
    } else if (status && status !== 'paid' && status !== 'downpayment') {
      where.status = status
    } else if (!status) {
      // When no status filter is provided, include all statuses
      where.status = {
        in: ['pending', 'confirmed', 'paid', 'completed', 'cancelled', 'no_show', 'expired'],
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: paymentStatusFilter ? { ...where, ...paymentStatusFilter } : where,
        include: {
          court: {
            include: {
              courtType: true,
            },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { bookingDate: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.booking.count({ where: paymentStatusFilter ? { ...where, ...paymentStatusFilter } : where }),
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
      payment: booking.payments?.[0] || null,
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

    if (!user.isIdVerified) {
      return NextResponse.json(
        { error: 'You need to verify your ID before booking a court. Please go to the Verify ID page.' },
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

    if (!court.isActive) {
      return NextResponse.json({ error: 'This court is currently unavailable for booking.' }, { status: 400 })
    }

    // Enforce booking settings from admin settings
    const minBookingHours = parseInt(await getSetting('minBookingHours', '1'))
    const maxAdvanceBookingDays = parseInt(await getSetting('maxAdvanceBookingDays', '30'))
    const bookingStartHour = parseInt(await getSetting('bookingStartHour', '6'))
    const bookingEndHour = parseInt(await getSetting('bookingEndHour', '22'))

    // Validate start/end within operating hours
    const reqStartHour = parseInt(data.startTime.split(':')[0])
    const reqEndHour = parseInt(data.endTime.split(':')[0])

    if (reqStartHour < bookingStartHour || reqEndHour > bookingEndHour) {
      return NextResponse.json(
        { error: `Bookings must be between ${bookingStartHour}:00 and ${bookingEndHour}:00` },
        { status: 400 }
      )
    }

    // Validate minimum duration
    const requestedDuration = reqEndHour - reqStartHour
    if (requestedDuration < minBookingHours) {
      return NextResponse.json(
        { error: `Minimum booking duration is ${minBookingHours} hour(s)` },
        { status: 400 }
      )
    }

    // Validate max advance booking days
    const bookingDate = new Date(data.bookingDate)
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    bookingDate.setHours(0, 0, 0, 0)
    const daysDiff = Math.ceil((bookingDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > maxAdvanceBookingDays) {
      return NextResponse.json(
        { error: `Bookings can only be made up to ${maxAdvanceBookingDays} days in advance` },
        { status: 400 }
      )
    }

    // Check availability - only PAID bookings should block the slot
    // Unpaid bookings (even if confirmed) don't reserve the slot
    const existingBooking = await prisma.booking.findFirst({
      where: {
        courtId: data.courtId,
        bookingDate: new Date(data.bookingDate),
        status: { in: ['confirmed', 'paid', 'completed'] },
        paymentStatus: { in: ['paid', 'downpayment'] },
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

    // Set expiry for all bookings - 30 minute payment window
    const expiresAt = new Date(Date.now() + RESERVATION_EXPIRY_MINUTES * 60 * 1000)

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
        status: 'confirmed',
        confirmedAt: new Date(),
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
        action: 'create_booking',
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
