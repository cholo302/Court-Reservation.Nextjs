const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.user.delete({
    where: { email: 'test@test.com' }
  })
  
  console.log('✓ Deleted test user:', result.email)
}

main()
  .catch(e => {
    if (e.code === 'P2025') {
      console.log('Test user not found in database')
    } else {
      console.error(e)
    }
  })
  .finally(() => prisma.$disconnect())
