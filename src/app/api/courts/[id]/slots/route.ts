import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Helper to get a setting from DB with a default fallback
async function getSetting(key: string, defaultValue: string): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } })
  return row?.value ?? defaultValue
}

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

    if (!court.isActive) {
      return NextResponse.json({ closed: true, reason: 'This court is currently unavailable.', slots: [] })
    }

    // Check for schedule exceptions (closed days)
    // Parse as local time to avoid UTC off-by-one in UTC+8 timezone
    const [exYr, exMo, exDy] = date.split('-').map(Number)
    const localDateStart = new Date(exYr, exMo - 1, exDy)
    const localDateEnd = new Date(exYr, exMo - 1, exDy + 1)
    const scheduleException = await prisma.courtSchedule.findFirst({
      where: {
        courtId,
        date: {
          gte: localDateStart,
          lt: localDateEnd,
        },
      },
    })

    if (scheduleException?.isClosed) {
      return NextResponse.json({
        closed: true,
        reason: scheduleException.reason,
        slots: [],
      })
    }

    // Get operating hours from settings
    const dbStartHour = parseInt(await getSetting('bookingStartHour', '6'))
    const dbEndHour = parseInt(await getSetting('bookingEndHour', '22'))

    const operatingHours = court.operatingHours ? JSON.parse(court.operatingHours) : null
    const dayOfWeek = new Date(date).getDay()
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = days[dayOfWeek]

    let startHour = dbStartHour
    let endHour = dbEndHour

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

    // Get existing bookings for this date - only PAID bookings block slots
    // Unpaid bookings (even if confirmed) should NOT block slots so others can book
    // Use local-time date range to avoid UTC off-by-one in timezone like UTC+8
    const [qyr, qmo, qdy] = date.split('-').map(Number)
    const dateStart = new Date(qyr, qmo - 1, qdy)
    const dateEnd = new Date(qyr, qmo - 1, qdy + 1)
    const existingBookings = await prisma.booking.findMany({
      where: {
        courtId,
        bookingDate: {
          gte: dateStart,
          lt: dateEnd,
        },
        status: {
          in: ['confirmed', 'paid', 'completed'],
        },
        paymentStatus: {
          in: ['paid', 'downpayment'],  // Only block if payment was verified by admin
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
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const weekendRate = court.weekendRate ? Number(court.weekendRate) : regularRate * 1.25

    // Check if the date is today to see if we need to exclude past hours
    // Parse date as LOCAL time (not UTC) to avoid timezone off-by-one issues
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const [yr, mo, dy] = date.split('-').map(Number)
    const selectedDate = new Date(yr, mo - 1, dy) // local midnight
    const isToday = today.getTime() === selectedDate.getTime()
    const currentHour = new Date().getHours()

    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`

      // Check if this slot is already booked
      const isBooked = existingBookings.some((booking) => {
        const bookingStart = parseInt(booking.startTime.split(':')[0])
        const bookingEnd = parseInt(booking.endTime.split(':')[0])
        return hour >= bookingStart && hour < bookingEnd
      })

      // Check if this slot is in the past (for today only)
      const isPast = isToday && hour <= currentHour

      const rate = isWeekend ? weekendRate : regularRate

      slots.push({
        start: startTime,
        end: endTime,
        available: !isBooked && !isPast,
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
