import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const DEFAULTS: Record<string, string> = {
  bookingStartHour: '6',
  bookingEndHour: '22',
  minBookingHours: '1',
  maxAdvanceBookingDays: '30',
  cancellationHours: '24',
}

export async function GET() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.keys(DEFAULTS) } },
  })
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value
  const merged = { ...DEFAULTS, ...map }

  return NextResponse.json({
    bookingStartHour: parseInt(merged.bookingStartHour),
    bookingEndHour: parseInt(merged.bookingEndHour),
    minBookingHours: parseInt(merged.minBookingHours),
    maxAdvanceBookingDays: parseInt(merged.maxAdvanceBookingDays),
    cancellationHours: parseInt(merged.cancellationHours),
  })
}
