const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding courts for Marikina Sports Center...')

  // Create court types first
  const basketballType = await prisma.courtType.upsert({
    where: { slug: 'basketball' },
    update: {},
    create: {
      name: 'Basketball',
      slug: 'basketball',
      icon: 'fa-basketball-ball',
    },
  })

  const badmintonType = await prisma.courtType.upsert({
    where: { slug: 'badminton' },
    update: {},
    create: {
      name: 'Badminton',
      slug: 'badminton',
      icon: 'fa-shuttlecock',
    },
  })

  const volleyballType = await prisma.courtType.upsert({
    where: { slug: 'volleyball' },
    update: {},
    create: {
      name: 'Volleyball',
      slug: 'volleyball',
      icon: 'fa-volleyball-ball',
    },
  })

  console.log('Court types created/updated.')

  // Create courts for Marikina Sports Center
  const courts = [
    {
      courtTypeId: basketballType.id,
      name: 'Marikina Sports Center - Basketball Court A',
      description: 'Full-size indoor basketball court with hardwood flooring, professional-grade hoops, and excellent lighting. Perfect for competitive games and training sessions.',
      location: 'Marikina Sports Center, Sumulong Highway',
      barangay: 'Sto. Niño',
      city: 'Marikina City',
      province: 'Metro Manila',
      hourlyRate: 800,
      peakHourRate: 1000,
      halfCourtRate: 450,
      weekendRate: 1000,
      capacity: 20,
      amenities: JSON.stringify(['Aircon', 'Shower Room', 'Locker', 'Parking', 'WiFi', 'Sound System']),
      rules: 'No food or drinks on court. Proper basketball attire required. Maximum 20 players per booking.',
      operatingHours: JSON.stringify({ open: '06:00', close: '22:00' }),
      minBookingHours: 1,
      maxBookingHours: 4,
      downpaymentPercent: 50,
      isActive: true,
    },
    {
      courtTypeId: badmintonType.id,
      name: 'Marikina Sports Center - Badminton Court 1',
      description: 'Professional badminton court with synthetic flooring, proper net height, and adequate ceiling clearance. Suitable for singles and doubles play.',
      location: 'Marikina Sports Center, Sumulong Highway',
      barangay: 'Sto. Niño',
      city: 'Marikina City',
      province: 'Metro Manila',
      hourlyRate: 400,
      peakHourRate: 550,
      halfCourtRate: null,
      weekendRate: 500,
      capacity: 4,
      amenities: JSON.stringify(['Aircon', 'Shower Room', 'Locker', 'Parking', 'Racket Rental']),
      rules: 'Non-marking shoes required. Maximum 4 players per court. Shuttlecocks available for purchase.',
      operatingHours: JSON.stringify({ open: '06:00', close: '22:00' }),
      minBookingHours: 1,
      maxBookingHours: 3,
      downpaymentPercent: 50,
      isActive: true,
    },
    {
      courtTypeId: volleyballType.id,
      name: 'Marikina Sports Center - Volleyball Court',
      description: 'Indoor volleyball court with rubberized flooring and adjustable net system. Great for recreational and competitive volleyball matches.',
      location: 'Marikina Sports Center, Sumulong Highway',
      barangay: 'Sto. Niño',
      city: 'Marikina City',
      province: 'Metro Manila',
      hourlyRate: 600,
      peakHourRate: 800,
      halfCourtRate: null,
      weekendRate: 750,
      capacity: 16,
      amenities: JSON.stringify(['Aircon', 'Shower Room', 'Locker', 'Parking', 'Ball Rental']),
      rules: 'Proper volleyball attire required. Maximum 16 players per booking. No outdoor shoes allowed.',
      operatingHours: JSON.stringify({ open: '06:00', close: '22:00' }),
      minBookingHours: 1,
      maxBookingHours: 3,
      downpaymentPercent: 50,
      isActive: true,
    },
  ]

  for (const courtData of courts) {
    const court = await prisma.court.create({
      data: courtData,
    })
    console.log(`Created: ${court.name}`)
  }

  console.log('\nAll courts seeded successfully!')
  console.log(`Total courts created: ${courts.length}`)
}

main()
  .catch((e) => {
    console.error('Error seeding courts:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
