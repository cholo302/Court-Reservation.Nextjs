import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const DEFAULTS: Record<string, string> = {
  gcashNumber: '09123456789',
  gcashName: 'Marikina Sports Center',
}

export async function GET() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.keys(DEFAULTS) } },
  })
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value
  const merged = { ...DEFAULTS, ...map }

  return NextResponse.json({
    gcashNumber: merged.gcashNumber,
    gcashName: merged.gcashName,
  })
}
