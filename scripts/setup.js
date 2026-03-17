/**
 * First-time project setup script.
 * Run with: npm run setup
 *
 * This will:
 * 1. Copy .env.example → .env (if .env doesn't exist)
 * 2. Generate Prisma client
 * 3. Create/push the SQLite database
 * 4. Seed admin user and sample courts
 * 5. Ensure upload directories exist
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function run(cmd, label) {
  console.log(`\n📦 ${label}...`);
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
  } catch (err) {
    console.error(`❌ Failed: ${label}`);
    process.exit(1);
  }
}

function ensureDir(dirPath) {
  const full = path.join(ROOT, dirPath);
  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true });
    console.log(`  📁 Created ${dirPath}`);
  }
  // Create .gitkeep so the folder is tracked by git
  const gitkeep = path.join(full, '.gitkeep');
  if (!fs.existsSync(gitkeep)) {
    fs.writeFileSync(gitkeep, '');
  }
}

console.log('🚀 Court Reservation — Project Setup\n');
console.log('='.repeat(50));

// 1. Create .env if it doesn't exist
const envPath = path.join(ROOT, '.env');
const envExamplePath = path.join(ROOT, '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('\n✅ Created .env from .env.example');
    console.log('   ➡  Edit .env to set NEXTAUTH_SECRET before deploying!');
  } else {
    console.error('\n❌ .env.example not found! Cannot create .env');
    process.exit(1);
  }
} else {
  console.log('\n✅ .env already exists — skipping copy');
}

// 2. Generate Prisma client
run('npx prisma generate', 'Generating Prisma client');

// 3. Push database schema (creates SQLite file if needed)
run('npx prisma db push', 'Creating/updating database');

// 4. Seed admin user
run('node scripts/seed-admin.js', 'Seeding admin user');

// 5. Seed sample courts
run('node scripts/seed-courts.js', 'Seeding sample courts');

// 6. Ensure upload directories exist
console.log('\n📦 Ensuring upload directories...');
ensureDir('public/uploads/proofs');
ensureDir('public/uploads/users');
ensureDir('public/uploads/qrcodes');

console.log('\n' + '='.repeat(50));
console.log('🎉 Setup complete!\n');
console.log('Next steps:');
console.log('  1. (Optional) Edit .env to customize settings');
console.log('  2. Run: npm run dev');
console.log('  3. Open: http://localhost:3000');
console.log('  4. Admin login: admin@court.com / admin123\n');
