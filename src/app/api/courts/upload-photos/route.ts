export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const courtId = formData.get('courtId') as string
    const files = formData.getAll('photos') as File[]

    if (!courtId || files.length === 0) {
      return NextResponse.json(
        { error: 'Court ID and photos are required' },
        { status: 400 }
      )
    }

    const uploadedPhotos = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) {
        continue
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Generate unique filename
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(7)
      const ext = file.name.split('.').pop() || 'jpg'
      const filename = `court-${courtId}-${timestamp}-${random}.${ext}`

      // Ensure directory exists
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'courts')
      await mkdir(uploadDir, { recursive: true })

      // Write file
      const filepath = join(uploadDir, filename)
      await writeFile(filepath, buffer)

      const photoUrl = `/uploads/courts/${filename}`

      // Save photo record in database
      const photo = await prisma.courtPhoto.create({
        data: {
          courtId: parseInt(courtId),
          photoUrl,
          isMain: i === 0 ? true : false,
          sortOrder: i,
        },
      })

      uploadedPhotos.push(photo)
    }

    return NextResponse.json({
      message: `${uploadedPhotos.length} photo(s) uploaded successfully`,
      photos: uploadedPhotos,
    })
  } catch (error: any) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { error: error?.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
