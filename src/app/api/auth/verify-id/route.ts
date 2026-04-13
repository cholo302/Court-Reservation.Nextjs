export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)

    const formData = await request.formData()
    const govIdType = formData.get('govIdType') as string
    const govIdPhoto = formData.get('govIdPhoto') as File
    const facePhoto = formData.get('facePhoto') as File

    // Validate required fields
    if (!govIdType || !govIdPhoto || !facePhoto) {
      return NextResponse.json(
        { error: 'ID type, ID photo, and face photo are all required' },
        { status: 400 }
      )
    }

    // Check file sizes (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (govIdPhoto.size > maxSize || facePhoto.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be under 10MB' },
        { status: 400 }
      )
    }

    // Save uploaded files
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'users', userId.toString())

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save gov ID photo
    const govIdBuffer = Buffer.from(await govIdPhoto.arrayBuffer())
    const govIdExt = govIdPhoto.name.split('.').pop() || 'jpg'
    const govIdFileName = `gov_id_${Date.now()}.${govIdExt}`
    const govIdPath = join(uploadDir, govIdFileName)
    await writeFile(govIdPath, govIdBuffer)

    // Save face photo
    const faceBuffer = Buffer.from(await facePhoto.arrayBuffer())
    const faceExt = facePhoto.name.split('.').pop() || 'jpg'
    const faceFileName = `face_${Date.now()}.${faceExt}`
    const facePath = join(uploadDir, faceFileName)
    await writeFile(facePath, faceBuffer)

    // Update user with photo paths and verification data
    // Face photo becomes the profile image
    const govIdPhotoUrl = `/uploads/users/${userId}/${govIdFileName}`
    const facePhotoUrl = `/uploads/users/${userId}/${faceFileName}`

    // Check if this is a resubmission (user previously had their ID rejected/invalidated)
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isIdInvalid: true, govIdPhoto: true },
    })
    const isResubmission = existingUser?.isIdInvalid === true

    await prisma.user.update({
      where: { id: userId },
      data: {
        govIdType,
        govIdPhoto: govIdPhotoUrl,
        facePhoto: facePhotoUrl,
        profileImage: facePhotoUrl,
        isIdVerified: false, // Admin must approve
        isIdInvalid: false,  // Reset invalid flag on resubmission
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId,
        action: isResubmission ? 'resubmit_documents' : 'submit_documents',
        description: isResubmission
          ? `User resubmitted government ID (${govIdType}) and selfie photo`
          : `User submitted government ID (${govIdType}) and selfie photo for verification`,
        entityType: 'user',
        entityId: userId,
      },
    })

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'verification_pending',
        title: 'ID Verification Submitted',
        message:
          'Your government ID and face photo have been submitted for verification. An admin will review your documents shortly.',
        channel: 'web',
      },
    })

    return NextResponse.json(
      { message: 'Verification documents submitted successfully.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Verify ID error:', error)
    return NextResponse.json(
      { error: 'Failed to submit verification. Please try again.' },
      { status: 500 }
    )
  }
}

