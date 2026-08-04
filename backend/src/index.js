const app = require('./app');
const { startReminderScheduler } = require('./services/reminderScheduler');
const PORT = process.env.PORT || 4000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🌿 Homeopathy Clinic API → http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Phone: use port 5173 (frontend), NOT ${PORT}\n`);
  startReminderScheduler();
});
