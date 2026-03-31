export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DEFAULT_SETTINGS: Record<string, string> = {
  siteName: 'Marikina Sports Center',
  siteEmail: 'contact@marikinasports.ph',
  sitePhone: '+63 912 345 6789',
  siteAddress: 'Shoe Avenue, Marikina City, Metro Manila',
  bookingStartHour: '6',
  bookingEndHour: '22',
  minBookingHours: '1',
  maxAdvanceBookingDays: '30',
  cancellationHours: '24',
  downpaymentPercent: '50',
  gcashNumber: '09123456789',
  gcashName: 'Marikina Sports Center',
  maintenanceMode: 'false',
  adminAlerts: 'true',
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await prisma.setting.findMany()
  const map: Record<string, string> = {}
  for (const row of rows) {
    map[row.key] = row.value
  }

  const merged = { ...DEFAULT_SETTINGS, ...map }

  return NextResponse.json({
    settings: {
      siteName: merged.siteName,
      siteEmail: merged.siteEmail,
      sitePhone: merged.sitePhone,
      siteAddress: merged.siteAddress,
      bookingStartHour: parseInt(merged.bookingStartHour),
      bookingEndHour: parseInt(merged.bookingEndHour),
      minBookingHours: parseInt(merged.minBookingHours),
      maxAdvanceBookingDays: parseInt(merged.maxAdvanceBookingDays),
      cancellationHours: parseInt(merged.cancellationHours),
      downpaymentPercent: parseInt(merged.downpaymentPercent),
      gcashNumber: merged.gcashNumber,
      gcashName: merged.gcashName,
      maintenanceMode: merged.maintenanceMode === 'true',
      adminAlerts: merged.adminAlerts === 'true',
    },
  })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  for (const [key, value] of Object.entries(body)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })
  }

  return NextResponse.json({ success: true })
}

