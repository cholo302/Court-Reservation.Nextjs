import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const setting = await prisma.setting.findUnique({ where: { key: 'maintenanceMode' } })
  return NextResponse.json({ maintenanceMode: setting?.value === 'true' })
}
