import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const DEFAULTS = {
  siteName: 'Marikina Sports Center',
  siteEmail: 'contact@marikinasports.ph',
  sitePhone: '+63 912 345 6789',
  siteAddress: 'Shoe Avenue, Marikina City, Metro Manila',
}

export async function GET() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.keys(DEFAULTS) } },
  })
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value
  return NextResponse.json({ ...DEFAULTS, ...map })
}
