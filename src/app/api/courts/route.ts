export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/courts - List all courts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const typeId = searchParams.get('type')
    const city = searchParams.get('city')
    const minPrice = searchParams.get('min_price')
    const maxPrice = searchParams.get('max_price')

    const where: any = {
      isActive: true,
    }

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { location: { contains: query } },
        { city: { contains: query } },
        { description: { contains: query } },
      ]
    }

    if (typeId) {
      where.courtTypeId = parseInt(typeId)
    }

    if (city) {
      where.city = city
    }

    if (minPrice) {
      where.hourlyRate = { ...where.hourlyRate, gte: parseFloat(minPrice) }
    }

    if (maxPrice) {
      where.hourlyRate = { ...where.hourlyRate, lte: parseFloat(maxPrice) }
    }

    const courts = await prisma.court.findMany({
      where,
      include: {
        courtType: true,
      },
      orderBy: { name: 'asc' },
    })

    const courtsWithType = courts.map((court) => ({
      ...court,
      hourlyRate: Number(court.hourlyRate),
      peakHourRate: court.peakHourRate ? Number(court.peakHourRate) : null,
      halfCourtRate: court.halfCourtRate ? Number(court.halfCourtRate) : null,
      weekendRate: court.weekendRate ? Number(court.weekendRate) : null,
      rating: Number(court.rating),
      courtTypeName: court.courtType?.name,
      courtTypeSlug: court.courtType?.slug,
      amenities: court.amenities ? JSON.parse(court.amenities) : [],
    }))

    return NextResponse.json({ courts: courtsWithType })
  } catch (error) {
    console.error('Error fetching courts:', error)
    return NextResponse.json({ error: 'Failed to fetch courts' }, { status: 500 })
  }
}

// POST /api/courts - Create a court (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const court = await prisma.court.create({
      data: {
        courtTypeId: data.courtTypeId,
        name: data.name,
        description: data.description,
        location: data.location,
        barangay: data.barangay,
        city: data.city,
        province: data.province,
        hourlyRate: data.hourlyRate,
        peakHourRate: data.peakHourRate,
        halfCourtRate: data.halfCourtRate,
        weekendRate: data.weekendRate,
        capacity: data.capacity,
        amenities: data.amenities ? JSON.stringify(data.amenities) : null,
        thumbnail: data.thumbnail,
        rules: data.rules,
        minBookingHours: data.minBookingHours || 1,
        maxBookingHours: data.maxBookingHours || 4,
        downpaymentPercent: data.downpaymentPercent || 50,
      },
      include: {
        courtType: true,
      },
    })

    return NextResponse.json(court, { status: 201 })
  } catch (error) {
    console.error('Error creating court:', error)
    return NextResponse.json({ error: 'Failed to create court' }, { status: 500 })
  }
}

