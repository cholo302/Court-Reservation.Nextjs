// Start script that loads .env before running next start
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Load .env file into process.env
const envPath = path.join(__dirname, '.env')
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

// Now start Next.js
require('next/dist/bin/next')
