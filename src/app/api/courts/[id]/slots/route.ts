import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { OPERATING_START_HOUR, OPERATING_END_HOUR, PEAK_HOURS_START, PEAK_HOURS_END } from '@/lib/utils'

// GET /api/courts/[id]/slots - Get available time slots for a date
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const courtId = parseInt(params.id)

    const court = await prisma.court.findUnique({
      where: { id: courtId },
    })

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    // Check for schedule exceptions (closed days)
    const scheduleException = await prisma.courtSchedule.findFirst({
      where: {
        courtId,
        date: new Date(date),
      },
    })

    if (scheduleException?.isClosed) {
      return NextResponse.json({
        closed: true,
        reason: scheduleException.reason,
        slots: [],
      })
    }

    // Get operating hours
    const operatingHours = court.operatingHours ? JSON.parse(court.operatingHours) : null
    const dayOfWeek = new Date(date).getDay()
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = days[dayOfWeek]

    let startHour = OPERATING_START_HOUR
    let endHour = OPERATING_END_HOUR

    if (operatingHours && operatingHours[dayName]) {
      const dayHours = operatingHours[dayName]
      startHour = parseInt(dayHours.open.split(':')[0])
      endHour = parseInt(dayHours.close.split(':')[0])
    } else if (scheduleException) {
      if (scheduleException.openTime) {
        startHour = parseInt(scheduleException.openTime.split(':')[0])
      }
      if (scheduleException.closeTime) {
        endHour = parseInt(scheduleException.closeTime.split(':')[0])
      }
    }

    // Get existing bookings for this date - only confirmed/paid/completed should block slots
    const existingBookings = await prisma.booking.findMany({
      where: {
        courtId,
        bookingDate: new Date(date),
        status: {
          in: ['confirmed', 'paid', 'completed'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    })

    // Generate time slots
    const slots = []
    const regularRate = Number(court.hourlyRate)
    const peakRate = court.peakHourRate ? Number(court.peakHourRate) : regularRate
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const weekendRate = court.weekendRate ? Number(court.weekendRate) : regularRate * 1.25

    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`

      // Check if this slot is already booked
      const isBooked = existingBookings.some((booking) => {
        const bookingStart = parseInt(booking.startTime.split(':')[0])
        const bookingEnd = parseInt(booking.endTime.split(':')[0])
        return hour >= bookingStart && hour < bookingEnd
      })

      const isPeak = hour >= PEAK_HOURS_START && hour < PEAK_HOURS_END
      let rate = regularRate
      
      if (isPeak) {
        rate = peakRate
      } else if (isWeekend) {
        rate = weekendRate
      }

      slots.push({
        start: startTime,
        end: endTime,
        available: !isBooked,
        isPeak,
        isWeekend,
        rate,
      })
    }

    return NextResponse.json({
      closed: false,
      slots,
      court: {
        id: court.id,
        name: court.name,
        hourlyRate: regularRate,
        peakHourRate: peakRate,
        halfCourtRate: court.halfCourtRate ? Number(court.halfCourtRate) : null,
        downpaymentPercent: court.downpaymentPercent,
        minBookingHours: court.minBookingHours,
        maxBookingHours: court.maxBookingHours,
      },
    })
  } catch (error) {
    console.error('Error fetching time slots:', error)
    return NextResponse.json({ error: 'Failed to fetch time slots' }, { status: 500 })
  }
}
