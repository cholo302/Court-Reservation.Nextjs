const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Get admin user
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@court.com' }
  })

  if (!admin) {
    console.log('Admin user not found')
    return
  }

  console.log('Admin user found:', admin.email)
  console.log('Current password hash:', admin.password)
  console.log('Hash length:', admin.password.length)

  // Test if password matches
  const testPassword = 'admin123'
  const matches = await bcrypt.compare(testPassword, admin.password)
  console.log(`\nPassword "${testPassword}" matches: ${matches}`)

  // If it doesn't match, let's reset it
  if (!matches) {
    console.log('\n⚠️  Password mismatch detected! Resetting password...')
    const newHash = await bcrypt.hash(testPassword, 12)
    
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: newHash }
    })
    
    console.log('✓ Password reset to: admin123')
    
    // Verify it works now
    const verifyHash = await prisma.user.findUnique({
      where: { email: 'admin@court.com' }
    })
    const verifyMatches = await bcrypt.compare(testPassword, verifyHash.password)
    console.log(`✓ Verification: Password now matches: ${verifyMatches}`)
  } else {
    console.log('\n✓ Password is correct!')
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
