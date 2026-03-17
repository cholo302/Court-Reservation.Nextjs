import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
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
        isRead: false,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'resubmit_documents',
        description: `User resubmitted government ID (${govIdType}) and selfie photo`,
        metadata: {
          govIdType,
          govIdPhoto: govIdFileName,
          facePhoto: faceFileName,
        },
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
