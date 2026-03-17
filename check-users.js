const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      password: true,
      role: true
    }
  })
  
  console.log('Users in database:')
  console.log(JSON.stringify(users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    hasPassword: u.password ? true : false,
    passwordLength: u.password ? u.password.length : 0
  })), null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
