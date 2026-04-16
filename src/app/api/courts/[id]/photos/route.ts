export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 
  // Mobile browsers sometimes report these incorrectly
  'application/octet-stream'
]
// HEIC/HEIF not supported - users need to convert on their device first
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif']
const REJECTED_EXTENSIONS = ['heic', 'heif']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB (increased for mobile photos)
const MAX_PHOTOS_PER_COURT = 10

// GET /api/courts/[id]/photos - Get all photos for a court
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courtId = parseInt(params.id)
    if (isNaN(courtId)) {
      return NextResponse.json({ error: 'Invalid court ID' }, { status: 400 })
    }

    const photos = await prisma.courtPhoto.findMany({
      where: { courtId },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ photos })
  } catch (error) {
    console.error('Error fetching court photos:', error)
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 })
  }
}

// POST /api/courts/[id]/photos - Upload photos for a court (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const courtId = parseInt(params.id)
    if (isNaN(courtId)) {
      return NextResponse.json({ error: 'Invalid court ID' }, { status: 400 })
    }

    // Check court exists
    const court = await prisma.court.findUnique({ where: { id: courtId } })
    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    // Check current photo count
    const currentCount = await prisma.courtPhoto.count({ where: { courtId } })
    
    const formData = await request.formData()
    const files = formData.getAll('photos') as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (currentCount + files.length > MAX_PHOTOS_PER_COURT) {
      return NextResponse.json({ 
        error: `Maximum ${MAX_PHOTOS_PER_COURT} photos per court. Currently ${currentCount}, trying to add ${files.length}.` 
      }, { status: 400 })
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'courts')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const uploaded = []
    const errors = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()?.toLowerCase() || ''

      // Check file extension first (more reliable on mobile)
      const isValidExt = ALLOWED_EXTENSIONS.includes(ext)
      const isValidMime = ALLOWED_MIME_TYPES.includes(file.type)

      if (!isValidExt && !isValidMime) {
        errors.push(`${file.name}: Invalid file type (${file.type || 'unknown'})`)
        continue
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 10MB)`)
        continue
      }

      if (file.size === 0) {
        errors.push(`${file.name}: Empty file`)
        continue
      }

      // Reject HEIC/HEIF - not supported on server, user needs to convert first
      if (REJECTED_EXTENSIONS.includes(ext)) {
        errors.push(`${file.name}: HEIC/HEIF format not supported. Please convert to JPG on your phone (iPhone: Settings > Camera > Formats > Most Compatible)`)
        continue
      }

      const outputExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : 'jpg'
      const uniqueName = `court-${courtId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${outputExt}`
      const filePath = path.join(uploadsDir, uniqueName)

      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        
        // Optimize images with sharp
        try {
          await sharp(buffer)
            .jpeg({ quality: 85 })
            .toFile(filePath)
        } catch {
          // If sharp fails, save raw file
          fs.writeFileSync(filePath, buffer)
        }

        const url = `/uploads/courts/${uniqueName}`

        const photo = await prisma.courtPhoto.create({
          data: {
            courtId,
            url,
            sortOrder: currentCount + i,
          },
        })

        uploaded.push(photo)
      } catch (fileError: any) {
        console.error(`Error saving file ${file.name}:`, fileError)
        errors.push(`${file.name}: Failed to save (${fileError?.message || 'unknown error'})`)
      }
    }

    if (uploaded.length === 0) {
      const errorMsg = errors.length > 0 
        ? `No files uploaded: ${errors.join('; ')}` 
        : 'No valid files were uploaded'
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    // If the court has no thumbnail, set the first uploaded photo as thumbnail
    if (!court.thumbnail && uploaded.length > 0) {
      await prisma.court.update({
        where: { id: courtId },
        data: { thumbnail: uploaded[0].url },
      })
    }

    return NextResponse.json({ 
      photos: uploaded, 
      count: uploaded.length,
      errors: errors.length > 0 ? errors : undefined
    }, { status: 201 })
  } catch (error) {
    console.error('Error uploading court photos:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// DELETE /api/courts/[id]/photos - Delete a specific photo (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const courtId = parseInt(params.id)
    if (isNaN(courtId)) {
      return NextResponse.json({ error: 'Invalid court ID' }, { status: 400 })
    }

    const { photoId } = await request.json()
    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID required' }, { status: 400 })
    }

    const photo = await prisma.courtPhoto.findFirst({
      where: { id: photoId, courtId },
    })

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), 'public', photo.url)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // Delete from database
    await prisma.courtPhoto.delete({ where: { id: photoId } })

    // If this was the thumbnail, update court thumbnail to next available photo
    const court = await prisma.court.findUnique({ where: { id: courtId } })
    if (court?.thumbnail === photo.url) {
      const nextPhoto = await prisma.courtPhoto.findFirst({
        where: { courtId },
        orderBy: { sortOrder: 'asc' },
      })
      await prisma.court.update({
        where: { id: courtId },
        data: { thumbnail: nextPhoto?.url || null },
      })
    }

    return NextResponse.json({ message: 'Photo deleted' })
  } catch (error) {
    console.error('Error deleting court photo:', error)
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 })
  }
}
