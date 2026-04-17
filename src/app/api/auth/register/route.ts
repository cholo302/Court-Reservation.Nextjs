export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { sendVerificationEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Trim and sanitize inputs
    const firstName = (body.firstName || '').trim()
    const middleName = (body.middleName || '').trim()
    const lastName = (body.lastName || '').trim()
    const email = (body.email || '').trim()
    const phone = (body.phone || '').trim()
    const password = body.password || ''

    // Build full name
    const name = [firstName, middleName, lastName].filter(Boolean).join(' ')

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'First name, last name, email, phone, and password are required' },
        { status: 400 }
      )
    }

    // Validate name fields
    const nameRegex = /^[a-zA-Z\u00C0-\u00FF\s\-']+$/
    if (firstName.length < 2 || firstName.length > 50) {
      return NextResponse.json(
        { error: 'First name must be between 2 and 50 characters' },
        { status: 400 }
      )
    }
    if (!nameRegex.test(firstName)) {
      return NextResponse.json(
        { error: 'First name contains invalid characters' },
        { status: 400 }
      )
    }
    if (lastName.length < 2 || lastName.length > 50) {
      return NextResponse.json(
        { error: 'Last name must be between 2 and 50 characters' },
        { status: 400 }
      )
    }
    if (!nameRegex.test(lastName)) {
      return NextResponse.json(
        { error: 'Last name contains invalid characters' },
        { status: 400 }
      )
    }
    if (middleName && (middleName.length > 50 || !nameRegex.test(middleName))) {
      return NextResponse.json(
        { error: 'Middle name contains invalid characters or exceeds 50 characters' },
        { status: 400 }
      )
    }

    // Validate email format
    if (email.length > 100) {
      return NextResponse.json(
        { error: 'Email must not exceed 100 characters' },
        { status: 400 }
      )
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Validate phone format (PH mobile)
    const normalizedPhone = phone.replace(/\s/g, '')
    if (!/^(09|\+639)\d{9}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid PH mobile number (e.g. 09171234567)' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }
    if (password.length > 128) {
      return NextResponse.json(
        { error: 'Password must not exceed 128 characters' },
        { status: 400 }
      )
    }
    if (!/[A-Za-z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one letter' },
        { status: 400 }
      )
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number' },
        { status: 400 }
      )
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase()

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
      where: { phone: normalizedPhone },
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
        phone: normalizedPhone,
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

