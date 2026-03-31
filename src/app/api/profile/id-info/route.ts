export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: {
        id: true,
        govIdType: true,
        govIdPhoto: true,
        govIdNumber: true,
        govIdName: true,
        govIdBirthdate: true,
        govIdExpiry: true,
        govIdAddress: true,
        govIdDetails: true,
        facePhoto: true,
        profileImage: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ idInfo: user })
  } catch (error) {
    console.error('Error fetching ID info:', error)
    return NextResponse.json({ error: 'Failed to fetch ID information' }, { status: 500 })
  }
}

