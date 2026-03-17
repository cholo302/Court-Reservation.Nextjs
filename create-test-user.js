const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Create or update a test user with a simple password
  const testEmail = 'test@test.com'
  const testPassword = 'Test@123456'
  
  console.log(`Creating test user: ${testEmail}`)
  console.log(`Password: ${testPassword}`)
  
  // Check if exists
  const existing = await prisma.user.findUnique({
    where: { email: testEmail }
  })
  
  const hashedPassword = await bcrypt.hash(testPassword, 12)
  
  let user
  if (existing) {
    // Update existing
    user = await prisma.user.update({
      where: { email: testEmail },
      data: { password: hashedPassword }
    })
    console.log('\n✓ Updated existing test user')
  } else {
    // Create new
    user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: testEmail,
        phone: '9999999999',
        password: hashedPassword,
        role: 'user',
        isActive: true,
        govIdType: 'test'
      }
    })
    console.log('\n✓ Created new test user')
  }
  
  console.log('\nTest credentials:')
  console.log('Email:', testEmail)
  console.log('Password:', testPassword)
  console.log('\nTry logging in with these credentials.')
  console.log('If it still fails, RESTART your development server!')
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
