const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function simulateLogin(email, password) {
  console.log(`\n🔍 Simulating login for: ${email}`)
  
  // Step 1: Find user
  console.log('Step 1: Finding user...')
  const user = await prisma.user.findUnique({
    where: { email }
  })
  
  if (!user) {
    console.log('❌ User not found')
    return
  }
  console.log('✓ User found:', user.name, '(' + user.email + ')')
  
  // Step 2: Compare password
  console.log('Step 2: Comparing password...')
  const isPasswordValid = await bcrypt.compare(password, user.password)
  
  if (!isPasswordValid) {
    console.log('❌ Password invalid')
    return
  }
  console.log('✓ Password matches')
  
  // Step 3: Check blacklist
  console.log('Step 3: Checking if blacklisted...')
  if (user.isBlacklisted) {
    console.log('❌ User is blacklisted:', user.blacklistReason)
    return
  }
  console.log('✓ Not blacklisted')
  
  // Step 4: Check ID validity
  console.log('Step 4: Checking ID validity...')
  if (user.isIdInvalid) {
    console.log('❌ ID is invalid')
    return
  }
  console.log('✓ ID is valid')
  
  // Step 5: Check if active
  console.log('Step 5: Checking if active...')
  if (!user.isActive) {
    console.log('❌ User is not active')
    return
  }
  console.log('✓ User is active')
  
  console.log('\n✅ LOGIN SUCCESS!')
  console.log('User:', { id: user.id, name: user.name, email: user.email, role: user.role })
}

async function main() {
  // Test admin login
  await simulateLogin('admin@court.com', 'admin123')
  
  // Test other user
  await simulateLogin('coco@gmail.com', 'password')
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
