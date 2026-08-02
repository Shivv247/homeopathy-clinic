const { execSync } = require('child_process');
const path = require('path');

const backendRoot = path.join(__dirname, '..');

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: backendRoot, stdio: 'inherit' });
}

if (!process.env.DATABASE_URL) {
  console.error('\n❌ DATABASE_URL is missing.');
  console.error('   Render → Environment → add DATABASE_URL (Supabase URI, port 5432).');
  console.error('   Encode special chars in password: @ → %40, # → %23\n');
  process.exit(1);
}

try {
  run('npx prisma db push --accept-data-loss');
  run('node scripts/ensure-seed.js');
  require(path.join(backendRoot, 'src', 'index.js'));
} catch (err) {
  console.error('\n❌ Startup failed:', err.message || err);
  process.exit(1);
}
