export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/admin/sidebar-counts - Lightweight counts for sidebar badges
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const [pendingBookings, pendingPayments, pendingUsers] = await Promise.all([
      prisma.booking.count({ where: { status: 'confirmed', paymentStatus: 'unpaid', createdAt: { gte: last24h } } }),
      prisma.payment.count({ where: { status: { in: ['pending', 'processing'] } } }),
      prisma.user.count({
        where: {
          role: 'user',
          isIdVerified: false,
          isIdInvalid: false,
          isActive: true,
          govIdPhoto: { not: null },
          facePhoto: { not: null },
        },
      }),
    ])

    return NextResponse.json({ pendingBookings, pendingPayments, pendingUsers })
  } catch {
    return NextResponse.json({ pendingBookings: 0, pendingPayments: 0, pendingUsers: 0 })
  }
}
