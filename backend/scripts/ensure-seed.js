const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const path = require('path');

async function main() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.count();
    if (users === 0) {
      console.log('📦 Empty database — running seed...');
      execSync('node prisma/seed.js', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
      });
    } else {
      console.log('✓ Database already has data');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
