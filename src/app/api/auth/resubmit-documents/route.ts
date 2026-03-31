export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()

    const email = formData.get('email') as string
    const govIdType = formData.get('govIdType') as string
    const govIdPhoto = formData.get('govIdPhoto') as File
    const facePhoto = formData.get('facePhoto') as File

    // ID scan data
    const govIdNumber = formData.get('govIdNumber') as string || null
    const govIdName = formData.get('govIdName') as string || null
    const govIdBirthdate = formData.get('govIdBirthdate') as string || null
    const govIdExpiry = formData.get('govIdExpiry') as string || null
    const govIdAddress = formData.get('govIdAddress') as string || null

    // Validate required fields
    if (!email || !govIdType || !govIdPhoto || !facePhoto) {
      return NextResponse.json(
        { error: 'All fields are required' },
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
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'users', user.id.toString())

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save gov ID photo
    const govIdBuffer = Buffer.from(await govIdPhoto.arrayBuffer())
    const govIdExt = govIdPhoto.name.split('.').pop() || 'jpg'
    const govIdFileName = `gov_id_${Date.now()}.${govIdExt}`
    const govIdPath = join(uploadDir, govIdFileName)
    console.log('Saving gov ID to:', govIdPath)
    await writeFile(govIdPath, govIdBuffer)

    // Save face photo
    const faceBuffer = Buffer.from(await facePhoto.arrayBuffer())
    const faceExt = facePhoto.name.split('.').pop() || 'jpg'
    const faceFileName = `face_${Date.now()}.${faceExt}`
    const facePath = join(uploadDir, faceFileName)
    console.log('Saving face photo to:', facePath)
    await writeFile(facePath, faceBuffer)

    // Update user with new photos (keep isIdInvalid: true until admin validates)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        govIdType,
        govIdPhoto: `/uploads/users/${user.id}/${govIdFileName}`,
        facePhoto: `/uploads/users/${user.id}/${faceFileName}`,
        profileImage: `/uploads/users/${user.id}/${faceFileName}`,
        govIdNumber: govIdNumber || undefined,
        govIdName: govIdName || undefined,
        govIdBirthdate: govIdBirthdate || undefined,
        govIdExpiry: govIdExpiry || undefined,
        govIdAddress: govIdAddress || undefined,
        // isIdInvalid remains true until admin manually validates the new documents
      },
    })

    console.log('User updated with new photos:', { govIdPhoto: updatedUser.govIdPhoto, facePhoto: updatedUser.facePhoto })

    // Create notification for user
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'id_resubmitted',
          title: 'Documents Under Review',
          message: 'Your resubmitted documents are under admin review. You will be notified once verified.',
        },
      })
      console.log('Notification created for user:', user.id)
    } catch (notifError) {
      console.error('Failed to create notification:', notifError)
    }

    // Create activity log
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'resubmit_documents',
          description: `User resubmitted government ID (${govIdType}) and selfie photo`,
          entityType: 'user',
          entityId: user.id,
        },
      })
      console.log('Activity log created for user:', user.id)
    } catch (logError) {
      console.error('Failed to create activity log:', logError)
    }

    return NextResponse.json(
      {
        message: 'Documents resubmitted successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          govIdPhoto: updatedUser.govIdPhoto,
          facePhoto: updatedUser.facePhoto,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Resubmit documents error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process documents' },
      { status: 500 }
    )
  }
}

