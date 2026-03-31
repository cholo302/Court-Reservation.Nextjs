export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.jfif': 'image/jpeg',
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const segments = params.path

  // Validate path segments — prevent path traversal
  for (const seg of segments) {
    if (seg === '..' || seg.includes('\\') || seg.includes('/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }
  }

  const filePath = path.join(process.cwd(), 'public', 'uploads', ...segments)

  // Ensure resolved path is within public/uploads
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  const resolvedPath = path.resolve(filePath)
  if (!resolvedPath.startsWith(uploadsDir)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  if (!existsSync(resolvedPath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  try {
    const buffer = await readFile(resolvedPath)
    const ext = path.extname(resolvedPath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 })
  }
}
