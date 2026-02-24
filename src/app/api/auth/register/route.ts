import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const password = formData.get('password') as string
    const govIdType = formData.get('govIdType') as string
    const govIdPhoto = formData.get('govIdPhoto') as File
    const facePhoto = formData.get('facePhoto') as File

    // Validate required fields
    if (!name || !email || !phone || !password || !govIdType || !govIdPhoto || !facePhoto) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
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

    // Create user first to get ID
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'user',
        govIdType,
        isActive: false, // Requires admin verification
      },
    })

    // Save uploaded files
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'users', user.id.toString())

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save gov ID photo
    const govIdBuffer = Buffer.from(await govIdPhoto.arrayBuffer())
    const govIdExt = govIdPhoto.name.split('.').pop()
    const govIdFileName = `gov_id_${Date.now()}.${govIdExt}`
    const govIdPath = join(uploadDir, govIdFileName)
    await writeFile(govIdPath, govIdBuffer)

    // Save face photo
    const faceBuffer = Buffer.from(await facePhoto.arrayBuffer())
    const faceExt = facePhoto.name.split('.').pop()
    const faceFileName = `face_${Date.now()}.${faceExt}`
    const facePath = join(uploadDir, faceFileName)
    await writeFile(facePath, faceBuffer)

    // Update user with photo paths
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        govIdPhoto: `/uploads/users/${user.id}/${govIdFileName}`,
        facePhoto: `/uploads/users/${user.id}/${faceFileName}`,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'register',
        description: `New user registered with ${govIdType} - Awaiting verification`,
        entityType: 'user',
        entityId: user.id,
      },
    })

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'verification_pending',
        title: 'Account Verification Pending',
        message:
          'Your account has been created. Please wait for admin to verify your government ID and face photo. This may take 5 minutes to 1 hour.',
        channel: 'web',
      },
    })

    return NextResponse.json(
      {
        message: 'Registration successful. Please wait for admin verification.',
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
