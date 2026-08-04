const { startOfDay, endOfDay, addDays, differenceInCalendarDays } = require('date-fns');
const prisma = require('../utils/prisma');
const { sendWhatsApp, followUpReminder } = require('./whatsapp');

const REMINDER_DAYS_BEFORE = Number(process.env.FOLLOWUP_REMINDER_DAYS_BEFORE || 1);
const INTERVAL_MS = Number(process.env.REMINDER_INTERVAL_MS || 6 * 60 * 60 * 1000); // 6 hours

let timer = null;

async function sendDueRemindersForClinic(clinic) {
  const today = startOfDay(new Date());
  const windowEnd = endOfDay(addDays(today, REMINDER_DAYS_BEFORE));

  const followUps = await prisma.followUp.findMany({
    where: {
      reminderSent: false,
      nextVisitDue: { not: null, gte: today, lte: windowEnd },
      patient: { clinicId: clinic.id },
    },
    include: { patient: true },
  });

  let sent = 0;
  for (const f of followUps) {
    if (!f.patient?.phone) continue;
    const daysUntil = differenceInCalendarDays(startOfDay(f.nextVisitDue), today);
    const body = followUpReminder(clinic, f.patient, daysUntil <= 0 ? 0 : daysUntil);
    const result = await sendWhatsApp({
      phone: f.patient.phone,
      body,
      patientId: f.patientId,
      template: 'auto_follow_up_reminder',
    });
    if (result.success) {
      await prisma.followUp.update({ where: { id: f.id }, data: { reminderSent: true } });
      sent += 1;
    }
  }
  return { sent, checked: followUps.length };
}

async function runAllClinicReminders() {
  try {
    const clinics = await prisma.clinic.findMany();
    let totalSent = 0;
    for (const clinic of clinics) {
      const { sent } = await sendDueRemindersForClinic(clinic);
      totalSent += sent;
    }
    if (totalSent > 0) {
      console.log(`[Reminders] Auto-sent ${totalSent} follow-up WhatsApp reminder(s)`);
    }
  } catch (e) {
    console.error('[Reminders] Scheduler error:', e.message);
  }
}

function startReminderScheduler() {
  if (process.env.NODE_ENV === 'test') return;
  if (process.env.DISABLE_AUTO_REMINDERS === 'true') return;

  // Run once on startup (after short delay for DB)
  setTimeout(() => runAllClinicReminders(), 15_000);

  if (timer) clearInterval(timer);
  timer = setInterval(runAllClinicReminders, INTERVAL_MS);
  console.log(`[Reminders] Auto follow-up scheduler active (every ${INTERVAL_MS / 3600000}h, ${REMINDER_DAYS_BEFORE}d before due)`);
}

function stopReminderScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = {
  startReminderScheduler,
  stopReminderScheduler,
  runAllClinicReminders,
  sendDueRemindersForClinic,
};
