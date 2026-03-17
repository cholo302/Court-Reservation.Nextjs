import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/admin/dashboard - Get dashboard stats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'month'

    // Auto-clean activity logs older than 24 hours
    await prisma.activityLog.deleteMany({
      where: {
        createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // For 30 days ahead
    const thirtyDaysLater = new Date(today)
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    
    const startOfYear = new Date(today.getFullYear(), 0, 1)

    // Determine date range based on parameter
    let rangeStart: Date | null = null
    if (range === 'day') rangeStart = today
    else if (range === 'week') rangeStart = startOfWeek
    else if (range === 'month') rangeStart = startOfMonth
    else if (range === 'year') rangeStart = startOfYear

    // Today's stats (use range to handle time components)
    const todayBookings = await prisma.booking.findMany({
      where: {
        bookingDate: { gte: today, lt: tomorrow },
      },
    })

    const todayCompleted = todayBookings.filter((b) => b.status === 'completed').length
    const todayRevenue = todayBookings
      .filter((b) => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + Number(b.totalAmount), 0)

    // Week stats
    const weekBookings = await prisma.booking.findMany({
      where: {
        bookingDate: { gte: startOfWeek },
      },
    })

    const weekRevenue = weekBookings
      .filter((b) => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + Number(b.totalAmount), 0)

    // Month stats
    const monthBookings = await prisma.booking.findMany({
      where: {
        bookingDate: { gte: startOfMonth },
      },
    })

    const monthRevenue = monthBookings
      .filter((b) => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + Number(b.totalAmount), 0)

    // All bookings (for reports)
    const allBookingsWhere = rangeStart ? { createdAt: { gte: rangeStart } } : {}
    const allBookings = await prisma.booking.findMany({
      where: allBookingsWhere,
      include: {
        court: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Total users
    const totalUsers = await prisma.user.count({ where: { role: 'user' } })
    
    // Total active courts
    const totalCourts = await prisma.court.count({ where: { isActive: true } })

    // Bookings by status
    const bookingsByStatus = [
      { status: 'pending', count: allBookings.filter((b) => b.status === 'pending').length },
      { status: 'confirmed', count: allBookings.filter((b) => b.status === 'confirmed').length },
      { status: 'paid', count: allBookings.filter((b) => b.status === 'paid').length },
      { status: 'completed', count: allBookings.filter((b) => b.status === 'completed').length },
      { status: 'cancelled', count: allBookings.filter((b) => b.status === 'cancelled').length },
    ].filter((s) => s.count > 0)

    // Revenue by month (last 6 months)
    const revenueByMonth: { month: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0)
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' })
      
      const monthlyRevenue = allBookings
        .filter((b) => {
          const bDate = new Date(b.createdAt)
          return bDate >= monthDate && bDate <= monthEnd && b.paymentStatus === 'paid'
        })
        .reduce((sum, b) => sum + Number(b.totalAmount), 0)
      
      revenueByMonth.push({ month: monthName, revenue: monthlyRevenue })
    }

    // Top performing courts
    const courtStats = new Map<number, { name: string; bookings: number; revenue: number }>()
    allBookings.forEach((b) => {
      if (b.court) {
        const existing = courtStats.get(b.courtId) || { name: b.court.name, bookings: 0, revenue: 0 }
        existing.bookings++
        if (b.paymentStatus === 'paid') {
          existing.revenue += Number(b.totalAmount)
        }
        courtStats.set(b.courtId, existing)
      }
    })
    const topCourts = Array.from(courtStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Recent bookings
    const recentBookings = allBookings.slice(0, 10).map((b) => ({
      id: b.id,
      bookingCode: b.bookingCode,
      courtName: b.court?.name,
      userName: b.user?.name,
      totalAmount: Number(b.totalAmount),
      status: b.status,
      bookingDate: b.bookingDate,
    }))

    // Pending payments needing verification
    const pendingPayments = await prisma.payment.findMany({
      where: { status: { in: ['pending', 'processing'] } },
      include: {
        booking: { include: { court: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Count confirmed bookings that haven't submitted payment yet (truly awaiting payment)
    // Only count FUTURE bookings - past unpaid bookings are stale/irrelevant
    const awaitingPaymentCount = await prisma.booking.count({
      where: {
        status: 'confirmed',
        paymentStatus: 'unpaid',
        bookingDate: { gte: today },
      },
    })

    // Upcoming bookings - fetch bookings from today onwards (within 30 days)
    const tomorrowStart = new Date(today)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)
    
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        bookingDate: { 
          gte: today,
          lte: thirtyDaysLater 
        },
        status: { in: ['confirmed', 'paid', 'completed'] },
      },
      include: {
        court: { include: { courtType: true } },
        user: { select: { name: true } },
      },
      orderBy: [{ bookingDate: 'asc' }, { startTime: 'asc' }],
      take: 10,
    })

    // Calculate total revenue for range
    const totalRevenue = allBookings
      .filter((b) => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + Number(b.totalAmount), 0)

    // Recent activity logs
    const recentActivityLogs = await prisma.activityLog.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
    })

    return NextResponse.json({
      // Reports data
      totalBookings: allBookings.length,
      totalRevenue,
      totalUsers,
      totalCourts,
      bookingsByStatus,
      revenueByMonth,
      topCourts,
      recentBookings,
      // Dashboard data
      stats: {
        today: {
          totalBookings: todayBookings.length,
          completed: todayCompleted,
          revenue: todayRevenue,
        },
        week: {
          totalBookings: weekBookings.length,
          revenue: weekRevenue,
        },
        month: {
          totalBookings: monthBookings.length,
          revenue: monthRevenue,
        },
      },
      pendingBookings: [],
      pendingPayments: pendingPayments.map((p) => ({
        ...p,
        amount: Number(p.amount),
        bookingCode: p.booking?.bookingCode,
        courtName: p.booking?.court?.name,
        userName: p.user?.name,
      })),
      awaitingPaymentCount,
      upcomingBookings: upcomingBookings.map((b) => ({
        ...b,
        totalAmount: Number(b.totalAmount),
        courtName: b.court?.name,
        courtType: b.court?.courtType?.name,
        userName: b.user?.name,
      })),
      recentActivityLogs: recentActivityLogs.map((log) => ({
        id: log.id,
        action: log.action,
        description: log.description,
        entityType: log.entityType,
        entityId: log.entityId,
        userName: log.user?.name || 'System',
        userEmail: log.user?.email,
        createdAt: log.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 })
  }
}
