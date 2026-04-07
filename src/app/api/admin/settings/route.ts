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
  gcashQrImage: '/uploads/qrcodes/gcash-qr.jpg',
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
      gcashQrImage: merged.gcashQrImage,
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

  const ALLOWED_KEYS = new Set(Object.keys(DEFAULT_SETTINGS))
  const errors: string[] = []

  for (const key of Object.keys(body)) {
    if (!ALLOWED_KEYS.has(key)) {
      errors.push(`Unknown setting: ${key}`)
    }
  }

  if (body.bookingStartHour !== undefined && body.bookingEndHour !== undefined) {
    const start = parseInt(body.bookingStartHour)
    const end = parseInt(body.bookingEndHour)
    if (isNaN(start) || isNaN(end) || start < 0 || start > 23 || end < 1 || end > 24) {
      errors.push('Booking hours must be valid hours (start: 0-23, end: 1-24)')
    } else if (start >= end) {
      errors.push('Booking start hour must be before end hour')
    }
  } else if (body.bookingStartHour !== undefined || body.bookingEndHour !== undefined) {
    const numVal = parseInt(body.bookingStartHour ?? body.bookingEndHour)
    if (isNaN(numVal) || numVal < 0 || numVal > 24) {
      errors.push('Booking hour must be a valid hour (0-24)')
    }
  }

  if (body.downpaymentPercent !== undefined) {
    const pct = parseInt(body.downpaymentPercent)
    if (isNaN(pct) || pct < 0 || pct > 100) {
      errors.push('Downpayment percent must be between 0 and 100')
    }
  }

  for (const numKey of ['minBookingHours', 'maxAdvanceBookingDays', 'cancellationHours']) {
    if (body[numKey] !== undefined) {
      const val = parseInt(body[numKey])
      if (isNaN(val) || val < 1) {
        errors.push(`${numKey} must be a positive integer`)
      }
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 400 })
  }

  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_KEYS.has(key)) continue
    await prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })
  }

  return NextResponse.json({ success: true })
}

