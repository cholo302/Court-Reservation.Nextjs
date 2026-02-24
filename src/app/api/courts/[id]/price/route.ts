import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { PEAK_HOURS_START, PEAK_HOURS_END } from '@/lib/utils'

// GET /api/courts/[id]/price - Calculate price for a booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const startTime = searchParams.get('start_time')
    const endTime = searchParams.get('end_time')
    const isHalfCourt = searchParams.get('half_court') === '1'

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'date, start_time, and end_time are required' },
        { status: 400 }
      )
    }

    const court = await prisma.court.findUnique({
      where: { id: parseInt(params.id) },
    })

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    const startHour = parseInt(startTime.split(':')[0])
    const endHour = parseInt(endTime.split(':')[0])
    const hours = endHour - startHour

    if (hours <= 0) {
      return NextResponse.json({ error: 'Invalid time range' }, { status: 400 })
    }

    const regularRate = Number(court.hourlyRate)
    const peakRate = court.peakHourRate ? Number(court.peakHourRate) : regularRate
    const halfCourtRate = court.halfCourtRate ? Number(court.halfCourtRate) : regularRate * 0.6

    const dayOfWeek = new Date(date).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const weekendRate = court.weekendRate ? Number(court.weekendRate) : regularRate * 1.25

    // Calculate price based on each hour
    let subtotal = 0
    let regularHours = 0
    let peakHours = 0
    let regularAmount = 0
    let peakAmount = 0

    for (let hour = startHour; hour < endHour; hour++) {
      const isPeak = hour >= PEAK_HOURS_START && hour < PEAK_HOURS_END
      let hourlyRate = regularRate

      if (isPeak) {
        hourlyRate = peakRate
        peakHours++
        peakAmount += hourlyRate
      } else if (isWeekend) {
        hourlyRate = weekendRate
        regularHours++
        regularAmount += hourlyRate
      } else {
        regularHours++
        regularAmount += hourlyRate
      }

      if (isHalfCourt) {
        hourlyRate = halfCourtRate
      }

      subtotal += hourlyRate
    }

    const total = isHalfCourt ? hours * halfCourtRate : subtotal
    const downpayment = Math.ceil(total * (court.downpaymentPercent / 100))
    const balance = total - downpayment

    return NextResponse.json({
      hours,
      subtotal: total,
      total,
      downpayment,
      balance,
      breakdown: {
        regularHours,
        peakHours,
        regularAmount: isHalfCourt ? regularHours * halfCourtRate : regularAmount,
        peakAmount: isHalfCourt ? peakHours * halfCourtRate : peakAmount,
      },
      rates: {
        regular: regularRate,
        peak: peakRate,
        halfCourt: halfCourtRate,
        weekend: weekendRate,
      },
      downpaymentPercent: court.downpaymentPercent,
    })
  } catch (error) {
    console.error('Error calculating price:', error)
    return NextResponse.json({ error: 'Failed to calculate price' }, { status: 500 })
  }
}
