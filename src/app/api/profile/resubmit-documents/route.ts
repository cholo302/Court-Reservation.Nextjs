export const dynamic = 'force-dynamic'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const email = formData.get('email') as string
    const govIdType = formData.get('govIdType') as string
    const govIdPhoto = formData.get('govIdPhoto') as File
    const facePhoto = formData.get('facePhoto') as File

    if (!email || !govIdPhoto || !facePhoto) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate file types and sizes
    for (const file of [govIdPhoto, facePhoto]) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Only images are allowed.` },
          { status: 400 }
        )
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File size exceeds 10MB limit' },
          { status: 400 }
        )
      }
    }

    // Verify the session user matches the email being updated
    if (session.user.email !== email) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'users', String(user.id))
    await mkdir(uploadsDir, { recursive: true })

    // Save government ID photo
    const govIdBuffer = await govIdPhoto.arrayBuffer()
    const govIdExtension = govIdPhoto.type.split('/')[1]
    const govIdFileName = `gov-id-${Date.now()}.${govIdExtension}`
    const govIdPath = join(uploadsDir, govIdFileName)
    await writeFile(govIdPath, Buffer.from(govIdBuffer))

    // Save face photo
    const faceBuffer = await facePhoto.arrayBuffer()
    const faceExtension = facePhoto.type.split('/')[1]
    const faceFileName = `selfie-${Date.now()}.${faceExtension}`
    const facePath = join(uploadsDir, faceFileName)
    await writeFile(facePath, Buffer.from(faceBuffer))

    // Update user with new document paths and reset invalid ID status
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        govIdType,
        govIdPhoto: `/uploads/users/${user.id}/${govIdFileName}`,
        facePhoto: `/uploads/users/${user.id}/${faceFileName}`,
        isIdInvalid: false, // Reset the invalid status so admin can review
      },
    })

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'id_resubmitted',
        title: 'Documents Resubmitted',
        message: 'Your documents have been resubmitted and are pending review.',
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'resubmit_documents',
        description: `User resubmitted government ID (${govIdType}) and selfie photo`,
      },
    })

    return NextResponse.json(
      {
        message: 'Documents submitted successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Resubmit documents error:', error)
    return NextResponse.json(
      { error: 'Failed to process documents' },
      { status: 500 }
    )
  }
}

