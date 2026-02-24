const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Admin credentials - change these as needed
  const adminEmail = 'admin@court.com'
  const adminPassword = 'admin123'
  const adminName = 'Admin User'

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (existingAdmin) {
    console.log(`Admin with email ${adminEmail} already exists.`)
    return
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    }
  })

  console.log('Admin user created successfully!')
  console.log('Email:', adminEmail)
  console.log('Password:', adminPassword)
}

main()
  .catch((e) => {
    console.error('Error creating admin:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
