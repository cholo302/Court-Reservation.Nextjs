export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { sendVerificationEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { firstName, middleName, lastName, email, phone, password } = await request.json()

    // Build full name
    const name = [firstName, middleName, lastName].filter(Boolean).join(' ')

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'First name, last name, email, phone, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim()

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    })

    if (existingPhone) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Create user - not active until email is verified
    const user = await prisma.user.create({
      data: {
        name,
        firstName,
        middleName: middleName || null,
        lastName,
        email: normalizedEmail,
        phone,
        password: hashedPassword,
        role: 'user',
        isActive: false, // Not active until email verified
        isIdVerified: false,
        rememberToken: verificationToken, // Temporarily store verification token
      },
    })

    // Create activity log for registration
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'user_registered',
        description: `New user registered: ${name}`,
        entityType: 'user',
        entityId: user.id,
      },
    })

    // Send verification email (non-blocking)
    sendVerificationEmail(normalizedEmail, firstName, verificationToken).catch((err) =>
      console.error('Failed to send verification email:', err)
    )

    return NextResponse.json(
      {
        message: 'Registration successful. Please check your email to verify your account.',
        userId: user.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}

