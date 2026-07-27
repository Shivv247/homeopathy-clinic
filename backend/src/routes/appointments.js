const express = require('express');
const { z } = require('zod');
const { startOfDay, endOfDay, parseISO } = require('date-fns');
const prisma = require('../utils/prisma');
const { asyncHandler, AppError } = require('../utils/errors');
const { authenticate, authorize, logActivity } = require('../middleware/auth');
const { nextToken } = require('../utils/counters');
const { sendWhatsApp, appointmentReminder } = require('../services/whatsapp');

const router = express.Router();
router.use(authenticate);

const apptSchema = z.object({
  patientId: z.string(),
  date: z.string(),
  timeSlot: z.string().optional().nullable(),
  type: z.enum(['NEW', 'FOLLOW_UP', 'WALK_IN']).optional(),
  notes: z.string().optional().nullable(),
});

router.get('/', asyncHandler(async (req, res) => {
  const { date, status } = req.query;
  const where = { clinicId: req.user.clinicId };
  if (date) {
    const d = parseISO(date);
    where.date = { gte: startOfDay(d), lte: endOfDay(d) };
  }
  if (status) where.status = status;

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      patient: { select: { id: true, fullName: true, uhid: true, phone: true, tag: true, photoUrl: true } },
    },
    orderBy: [{ tokenNumber: 'asc' }, { date: 'asc' }],
  });
  res.json({ success: true, appointments });
}));

router.get('/today', asyncHandler(async (req, res) => {
  const now = new Date();
  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId: req.user.clinicId,
      date: { gte: startOfDay(now), lte: endOfDay(now) },
    },
    include: {
      patient: { select: { id: true, fullName: true, uhid: true, phone: true, tag: true, gender: true, ageYears: true } },
    },
    orderBy: [{ tokenNumber: 'asc' }, { date: 'asc' }],
  });
  res.json({ success: true, appointments });
}));

router.post('/', authorize('DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
  const data = apptSchema.parse(req.body);
  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, clinicId: req.user.clinicId },
  });
  if (!patient) throw new AppError('Patient not found', 404);

  const date = new Date(data.date);
  const tokenNumber = await nextToken(req.user.clinicId, date);

  const appointment = await prisma.appointment.create({
    data: {
      clinicId: req.user.clinicId,
      patientId: patient.id,
      createdById: req.user.id,
      date,
      timeSlot: data.timeSlot,
      type: data.type || 'NEW',
      notes: data.notes,
      tokenNumber,
      status: data.type === 'WALK_IN' ? 'ARRIVED' : 'SCHEDULED',
    },
    include: { patient: true },
  });

  await logActivity(req, 'CREATE_APPOINTMENT', 'Appointment', appointment.id, { token: tokenNumber });
  res.status(201).json({ success: true, appointment });
}));

router.patch('/:id/status', authorize('DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['SCHEDULED', 'ARRIVED', 'IN_CONSULTATION', 'COMPLETED', 'NO_SHOW', 'CANCELLED'];
  if (!allowed.includes(status)) throw new AppError('Invalid status');

  const existing = await prisma.appointment.findFirst({
    where: { id: req.params.id, clinicId: req.user.clinicId },
  });
  if (!existing) throw new AppError('Appointment not found', 404);

  const appointment = await prisma.appointment.update({
    where: { id: existing.id },
    data: { status },
    include: { patient: true },
  });
  res.json({ success: true, appointment });
}));

router.post('/:id/remind', authorize('DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
  const appointment = await prisma.appointment.findFirst({
    where: { id: req.params.id, clinicId: req.user.clinicId },
    include: { patient: true },
  });
  if (!appointment) throw new AppError('Appointment not found', 404);

  const body = appointmentReminder(req.user.clinic, appointment.patient, appointment);
  const result = await sendWhatsApp({
    phone: appointment.patient.phone,
    body,
    template: 'appointment_reminder',
    patientId: appointment.patientId,
  });
  if (result.success) {
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { reminderSent: true },
    });
  }
  res.json({ success: result.success, result });
}));

module.exports = router;
