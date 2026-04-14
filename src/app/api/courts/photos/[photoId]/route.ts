export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

// DELETE a photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { photoId: string } }
) {
  try {
    const photoId = parseInt(params.photoId)

    const photo = await prisma.courtPhoto.findUnique({
      where: { id: photoId },
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Delete file from filesystem
    if (photo.photoUrl) {
      try {
        const filepath = join(process.cwd(), 'public', photo.photoUrl.substring(1))
        await unlink(filepath)
      } catch (err) {
        console.error('Failed to delete file:', err)
      }
    }

    // Delete from database
    await prisma.courtPhoto.delete({
      where: { id: photoId },
    })

    return NextResponse.json({
      message: 'Photo deleted successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to delete photo' },
      { status: 500 }
    )
  }
}

// PATCH to update photo metadata (set as main, reorder)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { photoId: string } }
) {
  try {
    const photoId = parseInt(params.photoId)
    const body = await request.json()

    const currentPhoto = await prisma.courtPhoto.findUnique({
      where: { id: photoId },
    })

    if (!currentPhoto) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // If setting as main, unset others
    if (body.isMain) {
      await prisma.courtPhoto.updateMany({
        where: { courtId: currentPhoto.courtId, isMain: true },
        data: { isMain: false },
      })
    }

    const updatedPhoto = await prisma.courtPhoto.update({
      where: { id: photoId },
      data: body,
    })

    return NextResponse.json({
      message: 'Photo updated successfully',
      photo: updatedPhoto,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update photo' },
      { status: 500 }
    )
  }
}
