export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { OPERATING_START_HOUR, OPERATING_END_HOUR, isPeakHour, isWeekend } from '@/lib/utils'

// GET /api/courts/[id]/slots?date=YYYY-MM-DD
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courtId = parseInt(params.id)
    if (isNaN(courtId)) {
      return NextResponse.json({ error: 'Invalid court ID' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
    }

    // Find the court
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      select: {
        id: true,
        isActive: true,
        operatingHours: true,
        hourlyRate: true,
        peakHourRate: true,
        weekendRate: true,
      },
    })

    if (!court || !court.isActive) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    // Check for court schedule overrides (closures or custom hours)
    const dateStart = new Date(dateStr + 'T00:00:00')
    const dateEnd = new Date(dateStr + 'T23:59:59')

    const schedule = await prisma.courtSchedule.findFirst({
      where: {
        courtId,
        date: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
    })

    // If court is closed on this date
    if (schedule?.isClosed) {
      return NextResponse.json({
        closed: true,
        reason: schedule.reason || 'Court is closed on this date',
        slots: [],
      })
    }

    // Determine operating hours
    let startHour = OPERATING_START_HOUR
    let endHour = OPERATING_END_HOUR

    // Court-specific operating hours override
    if (court.operatingHours) {
      try {
        const opHours = JSON.parse(court.operatingHours as string)
        if (opHours.open) startHour = parseInt(opHours.open)
        if (opHours.close) endHour = parseInt(opHours.close)
      } catch {
        // Use defaults
      }
    }

    // Schedule-specific hour overrides
    if (schedule?.openTime) {
      startHour = parseInt(schedule.openTime.split(':')[0])
    }
    if (schedule?.closeTime) {
      endHour = parseInt(schedule.closeTime.split(':')[0])
    }

    // Find existing bookings for this court on this date
    const bookings = await prisma.booking.findMany({
      where: {
        courtId,
        bookingDate: {
          gte: dateStart,
          lte: dateEnd,
        },
        status: {
          notIn: ['cancelled', 'expired'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    })

    // Build set of booked hours
    const bookedHours = new Set<number>()
    for (const booking of bookings) {
      const bStart = parseInt(booking.startTime.split(':')[0])
      const bEnd = parseInt(booking.endTime.split(':')[0])
      for (let h = bStart; h < bEnd; h++) {
        bookedHours.add(h)
      }
    }

    // Generate time slots
    const weekend = isWeekend(dateStr)
    const slots = []
    for (let h = startHour; h < endHour; h++) {
      const start = `${h.toString().padStart(2, '0')}:00`
      const end = `${(h + 1).toString().padStart(2, '0')}:00`
      const available = !bookedHours.has(h)

      slots.push({ start, end, available })
    }

    return NextResponse.json({ slots, closed: false })
  } catch (error) {
    console.error('Error fetching slots:', error)
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 })
  }
}
