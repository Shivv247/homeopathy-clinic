const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { asyncHandler, AppError } = require('../utils/errors');
const { authenticate, authorize, logActivity } = require('../middleware/auth');
const { sendWhatsApp, followUpReminder } = require('../services/whatsapp');

const router = express.Router();
router.use(authenticate);
router.use(authorize('DOCTOR', 'RECEPTIONIST'));

router.post('/send', asyncHandler(async (req, res) => {
  const schema = z.object({
    phone: z.string().min(10),
    body: z.string().min(1),
    patientId: z.string().optional().nullable(),
    template: z.string().optional(),
  });
  const data = schema.parse(req.body);
  const result = await sendWhatsApp(data);
  await logActivity(req, 'SEND_MESSAGE', 'Message', result.logId, { phone: data.phone });
  res.json({ success: result.success, result });
}));

router.post('/bulk', authorize('DOCTOR'), asyncHandler(async (req, res) => {
  const schema = z.object({
    body: z.string().min(1),
    tag: z.string().optional(),
    patientIds: z.array(z.string()).optional(),
  });
  const data = schema.parse(req.body);

  let patients;
  if (data.patientIds?.length) {
    patients = await prisma.patient.findMany({
      where: { clinicId: req.user.clinicId, id: { in: data.patientIds } },
    });
  } else {
    patients = await prisma.patient.findMany({
      where: {
        clinicId: req.user.clinicId,
        ...(data.tag ? { tag: data.tag } : { tag: { not: 'INACTIVE' } }),
      },
    });
  }

  const results = [];
  for (const p of patients) {
    const r = await sendWhatsApp({
      phone: p.phone,
      body: data.body.replace('{name}', p.fullName),
      patientId: p.id,
      template: 'bulk',
    });
    results.push({ patientId: p.id, ...r });
  }

  await logActivity(req, 'BULK_MESSAGE', 'Message', null, { count: results.length });
  res.json({ success: true, sent: results.filter((r) => r.success).length, total: results.length, results });
}));

router.post('/follow-up-reminders', authorize('DOCTOR'), asyncHandler(async (req, res) => {
  const daysAhead = parseInt(req.body.daysAhead || '3', 10);
  const target = new Date();
  target.setDate(target.getDate() + daysAhead);
  target.setHours(0, 0, 0, 0);
  const end = new Date(target);
  end.setHours(23, 59, 59, 999);

  const followUps = await prisma.followUp.findMany({
    where: {
      nextVisitDue: { gte: target, lte: end },
      reminderSent: false,
      patient: { clinicId: req.user.clinicId },
    },
    include: { patient: true },
  });

  let sent = 0;
  for (const f of followUps) {
    const body = followUpReminder(req.user.clinic, f.patient, daysAhead);
    const r = await sendWhatsApp({
      phone: f.patient.phone,
      body,
      patientId: f.patientId,
      template: 'follow_up_reminder',
    });
    if (r.success) {
      await prisma.followUp.update({ where: { id: f.id }, data: { reminderSent: true } });
      sent++;
    }
  }
  res.json({ success: true, sent, total: followUps.length });
}));

router.get('/logs', asyncHandler(async (req, res) => {
  const logs = await prisma.messageLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ success: true, logs });
}));

module.exports = router;
