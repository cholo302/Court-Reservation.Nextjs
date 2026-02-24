import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { sms, email } = body

    const preferences = JSON.stringify({ sms: !!sms, email: !!email })

    await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: { preferences },
    })

    return NextResponse.json({ message: 'Preferences updated successfully' })
  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}
