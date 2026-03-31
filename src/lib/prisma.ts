import { PrismaClient } from '@prisma/client'
import path from 'path'

// Ensure DATABASE_URL is set before Prisma initializes
// This handles cases where .env isn't loaded (e.g. PM2 started without ecosystem.config.js)
if (!process.env.DATABASE_URL) {
  const dbPath = path.join(process.cwd(), 'prisma', 'court_reservation.sqlite')
  process.env.DATABASE_URL = `file:${dbPath}`
}

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
