const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const path = require('path');
const { ensureDemoReports } = require('./ensure-demo-reports');

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
      await ensureDemoReports(prisma);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
