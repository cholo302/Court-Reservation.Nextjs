import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/courts/[id] - Get a single court
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const court = await prisma.court.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        courtType: true,
        reviews: {
          include: {
            user: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    const reviews = court.reviews.map((review) => ({
      ...review,
      userName: review.user?.name,
    }))

    const courtWithDetails = {
      ...court,
      hourlyRate: Number(court.hourlyRate),
      peakHourRate: court.peakHourRate ? Number(court.peakHourRate) : null,
      halfCourtRate: court.halfCourtRate ? Number(court.halfCourtRate) : null,
      weekendRate: court.weekendRate ? Number(court.weekendRate) : null,
      rating: Number(court.rating),
      courtTypeName: court.courtType?.name,
      courtTypeSlug: court.courtType?.slug,
      courtTypeIcon: court.courtType?.icon,
      amenities: court.amenities ? JSON.parse(court.amenities) : [],
    }

    return NextResponse.json({ court: courtWithDetails, reviews })
  } catch (error) {
    console.error('Error fetching court:', error)
    return NextResponse.json({ error: 'Failed to fetch court' }, { status: 500 })
  }
}

// PUT /api/courts/[id] - Update a court (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const court = await prisma.court.update({
      where: { id: parseInt(params.id) },
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
        minBookingHours: data.minBookingHours,
        maxBookingHours: data.maxBookingHours,
        downpaymentPercent: data.downpaymentPercent,
        isActive: data.isActive,
      },
    })

    return NextResponse.json(court)
  } catch (error) {
    console.error('Error updating court:', error)
    return NextResponse.json({ error: 'Failed to update court' }, { status: 500 })
  }
}

// PATCH /api/courts/[id] - Partial update a court (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Build update data dynamically based on provided fields
    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.courtTypeId !== undefined) updateData.courtTypeId = data.courtTypeId
    if (data.description !== undefined) updateData.description = data.description
    if (data.location !== undefined) updateData.location = data.location
    if (data.barangay !== undefined) updateData.barangay = data.barangay
    if (data.city !== undefined) updateData.city = data.city
    if (data.province !== undefined) updateData.province = data.province
    if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate
    if (data.peakHourRate !== undefined) updateData.peakHourRate = data.peakHourRate
    if (data.halfCourtRate !== undefined) updateData.halfCourtRate = data.halfCourtRate
    if (data.weekendRate !== undefined) updateData.weekendRate = data.weekendRate
    if (data.capacity !== undefined) updateData.capacity = data.capacity
    if (data.amenities !== undefined) updateData.amenities = data.amenities ? JSON.stringify(data.amenities) : null
    if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail
    if (data.rules !== undefined) updateData.rules = data.rules
    if (data.minBookingHours !== undefined) updateData.minBookingHours = data.minBookingHours
    if (data.maxBookingHours !== undefined) updateData.maxBookingHours = data.maxBookingHours
    if (data.downpaymentPercent !== undefined) updateData.downpaymentPercent = data.downpaymentPercent
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const court = await prisma.court.update({
      where: { id: parseInt(params.id) },
      data: updateData,
    })

    return NextResponse.json(court)
  } catch (error) {
    console.error('Error updating court:', error)
    return NextResponse.json({ error: 'Failed to update court' }, { status: 500 })
  }
}

// DELETE /api/courts/[id] - Delete a court (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.court.delete({
      where: { id: parseInt(params.id) },
    })

    return NextResponse.json({ message: 'Court deleted successfully' })
  } catch (error) {
    console.error('Error deleting court:', error)
    return NextResponse.json({ error: 'Failed to delete court' }, { status: 500 })
  }
}
