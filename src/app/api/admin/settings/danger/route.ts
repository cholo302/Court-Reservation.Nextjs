export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action } = await req.json()

  if (action === 'clear-data') {
    // Clear all transactional data (bookings, payments, notifications, activity logs)
    // Keep users, courts, settings intact
    await prisma.$transaction([
      prisma.payment.deleteMany(),
      prisma.review.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.activityLog.deleteMany(),
      prisma.booking.deleteMany(),
    ])

    return NextResponse.json({ success: true, message: 'All booking data cleared' })
  }

  if (action === 'clear-cache') {
    // For SQLite there's no traditional cache, but we can clear expired/stale data
    const now = new Date()
    
    // Delete expired bookings that were never paid
    await prisma.booking.deleteMany({
      where: {
        status: { in: ['pending', 'confirmed'] },
        paymentStatus: 'unpaid',
        expiresAt: { lt: now },
      },
    })

    // Delete old read notifications (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    await prisma.notification.deleteMany({
      where: {
        readAt: { not: null },
        createdAt: { lt: thirtyDaysAgo },
      },
    })

    return NextResponse.json({ success: true, message: 'Stale data cleared' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

