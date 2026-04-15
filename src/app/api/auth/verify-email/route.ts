export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: { rememberToken: token },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Check if token has expired (24 hours from account creation)
    const hoursSinceCreation = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceCreation > 24) {
      return NextResponse.json(
        { error: 'Verification link has expired. Please register again.' },
        { status: 400 }
      )
    }

    // Update user - mark email as verified and activate account
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        isActive: true,
        rememberToken: null, // Clear the token after use
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'user_registered',
        description: `Email verified for user: ${user.name}`,
        entityType: 'user',
        entityId: user.id,
      },
    })

    return NextResponse.json(
      {
        message: 'Email verified successfully! Your account is now active. You can now log in and verify your ID.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Email verification failed. Please try again.' },
      { status: 500 }
    )
  }
}
