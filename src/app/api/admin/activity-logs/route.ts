export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/admin/activity-logs - Fetch recent activity logs (lightweight endpoint for polling)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Auto-clean activity logs older than 24 hours
    await prisma.activityLog.deleteMany({
      where: {
        createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })

    const recentActivityLogs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json({
      logs: recentActivityLogs.map((log) => ({
        id: log.id,
        action: log.action,
        description: log.description,
        entityType: log.entityType,
        entityId: log.entityId,
        userName: log.user?.name || 'System',
        userEmail: log.user?.email || null,
        createdAt: log.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 })
  }
}

