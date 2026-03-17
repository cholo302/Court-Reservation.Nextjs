const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Activate all inactive users
  const updated = await prisma.user.updateMany({
    where: { isActive: false },
    data: { isActive: true }
  })
  
  console.log(`Activated ${updated.count} inactive users`)
  
  // Show all users now
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      isActive: true
    }
  })
  
  console.log('\nAll users after activation:')
  users.forEach(u => {
    console.log(`- ${u.email}: ${u.isActive ? '✓ ACTIVE' : '✗ INACTIVE'}`)
  })
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
