// Start script that loads .env before running next start
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const PROJECT_ROOT = __dirname

// Load .env file into process.env
const envPath = path.join(PROJECT_ROOT, '.env')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.substring(0, eqIndex).trim()
    let value = trimmed.substring(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
  console.log('✅ Loaded .env file with', Object.keys(process.env).filter(k => k === 'NEXTAUTH_SECRET' || k === 'NEXTAUTH_URL' || k === 'DATABASE_URL').length, 'key vars')
} else {
  console.error('❌ No .env file found at', envPath)
  console.error('   Run: cp .env.production.example .env && nano .env')
}

// Always ensure DATABASE_URL is set (absolute path to SQLite file)
if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'file:./court_reservation.sqlite' || process.env.DATABASE_URL === 'file:./prisma/court_reservation.sqlite') {
  const absDbPath = path.join(PROJECT_ROOT, 'prisma', 'court_reservation.sqlite')
  process.env.DATABASE_URL = 'file:' + absDbPath
  console.log('📂 Set DATABASE_URL to:', process.env.DATABASE_URL)
} else if (process.env.DATABASE_URL.startsWith('file:./')) {
  // Resolve any other relative path
  const relPath = process.env.DATABASE_URL.replace('file:./', '')
  const absPath = path.join(PROJECT_ROOT, 'prisma', relPath)
  process.env.DATABASE_URL = 'file:' + absPath
  console.log('📂 Resolved DATABASE_URL to:', process.env.DATABASE_URL)
}

// Verify database file exists
const dbMatch = (process.env.DATABASE_URL || '').match(/^file:(.+)$/)
if (dbMatch) {
  const dbPath = dbMatch[1]
  if (!fs.existsSync(dbPath)) {
    console.error('⚠️  Database file not found at:', dbPath)
    console.error('   Run: npx prisma db push  (to create the database)')
    console.error('   Then: node scripts/seed-admin.js  (to seed admin user)')
  } else {
    console.log('✅ Database file found at:', dbPath)
  }
}

// Ensure NEXTAUTH_SECRET is set
if (!process.env.NEXTAUTH_SECRET) {
  console.error('⚠️  NEXTAUTH_SECRET is not set! Auth will not work properly.')
  console.error('   Add NEXTAUTH_SECRET to your .env file')
  console.error('   Generate one with: openssl rand -base64 32')
}

// Now start Next.js
require('next/dist/bin/next')
