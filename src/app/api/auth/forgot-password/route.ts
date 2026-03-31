export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, a reset link has been generated.',
      })
    }

    // Invalidate any existing unused tokens for this email
    await prisma.passwordReset.updateMany({
      where: { email: user.email, usedAt: null },
      data: { usedAt: new Date() },
    })

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    await prisma.passwordReset.create({
      data: {
        email: user.email,
        token,
        expiresAt,
      },
    })

    return NextResponse.json({
      message: 'If an account with that email exists, a reset link has been generated.',
      token, // included so the client can redirect to reset page
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

