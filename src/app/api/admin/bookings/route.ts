import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/admin/bookings - List all bookings (admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '20')

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (date) {
      where.bookingDate = new Date(date)
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          court: { include: { courtType: true } },
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.booking.count({ where }),
    ])

    return NextResponse.json({
      items: bookings.map((b) => ({
        ...b,
        durationHours: Number(b.durationHours),
        hourlyRate: Number(b.hourlyRate),
        totalAmount: Number(b.totalAmount),
        downpaymentAmount: Number(b.downpaymentAmount),
        balanceAmount: Number(b.balanceAmount),
        courtName: b.court?.name,
        courtType: b.court?.courtType?.name,
        userName: b.user?.name,
        userEmail: b.user?.email,
        userPhone: b.user?.phone,
      })),
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
