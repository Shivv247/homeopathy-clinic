const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { asyncHandler, AppError } = require('../utils/errors');
const { authenticate, authorize, logActivity } = require('../middleware/auth');
const { nextUhid, nextFamilyId } = require('../utils/counters');
const { upload } = require('../middleware/upload');

const router = express.Router();
router.use(authenticate);

const patientSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  alternatePhone: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  ageYears: z.number().int().optional().nullable(),
  gender: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  referredBy: z.string().optional().nullable(),
  tag: z.enum(['NEW', 'FOLLOW_UP', 'INACTIVE', 'VIP']).optional(),
  bloodGroup: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  familyId: z.string().optional().nullable(),
  createFamily: z.boolean().optional(),
  familyName: z.string().optional().nullable(),
});

router.get('/', asyncHandler(async (req, res) => {
  const { q, tag, page = 1, limit = 20 } = req.query;
  const take = Math.min(parseInt(limit, 10) || 20, 100);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const where = { clinicId: req.user.clinicId };
  if (tag) where.tag = tag;
  if (q) {
    where.OR = [
      { fullName: { contains: q } },
      { phone: { contains: q } },
      { uhid: { contains: q } },
      { alternatePhone: { contains: q } },
    ];
  }

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      include: { family: true, _count: { select: { caseRecords: true, appointments: true } } },
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
    }),
    prisma.patient.count({ where }),
  ]);

  res.json({ success: true, patients, total, page: Number(page), limit: take });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const patient = await prisma.patient.findFirst({
    where: { id: req.params.id, clinicId: req.user.clinicId },
    include: {
      family: { include: { patients: { select: { id: true, fullName: true, uhid: true, phone: true, tag: true } } } },
      caseRecords: { orderBy: { visitDate: 'desc' }, take: 20 },
      prescriptions: { orderBy: { visitDate: 'desc' }, take: 10, include: { items: true } },
      appointments: { orderBy: { date: 'desc' }, take: 10 },
      attachments: { orderBy: { uploadedAt: 'desc' } },
      followUps: { orderBy: { visitDate: 'desc' }, take: 20 },
      invoices: { orderBy: { visitDate: 'desc' }, take: 10 },
    },
  });
  if (!patient) throw new AppError('Patient not found', 404);
  res.json({ success: true, patient });
}));

router.post('/', authorize('DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
  const data = patientSchema.parse(req.body);
  let familyDbId = data.familyId || null;

  if (data.createFamily) {
    const famCode = await nextFamilyId();
    const fam = await prisma.family.create({
      data: { familyId: famCode, name: data.familyName || `${data.fullName}'s Family` },
    });
    familyDbId = fam.id;
  }

  const uhid = await nextUhid(req.user.clinicId);
  const patient = await prisma.patient.create({
    data: {
      clinicId: req.user.clinicId,
      uhid,
      familyId: familyDbId,
      fullName: data.fullName,
      phone: data.phone,
      alternatePhone: data.alternatePhone,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      ageYears: data.ageYears,
      gender: data.gender,
      address: data.address,
      city: data.city,
      occupation: data.occupation,
      maritalStatus: data.maritalStatus,
      referredBy: data.referredBy,
      tag: data.tag || 'NEW',
      bloodGroup: data.bloodGroup,
      notes: data.notes,
      birthday: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
    },
    include: { family: true },
  });

  await logActivity(req, 'CREATE_PATIENT', 'Patient', patient.id, { uhid, name: patient.fullName });
  res.status(201).json({ success: true, patient });
}));

router.put('/:id', authorize('DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
  const existing = await prisma.patient.findFirst({
    where: { id: req.params.id, clinicId: req.user.clinicId },
  });
  if (!existing) throw new AppError('Patient not found', 404);

  const data = patientSchema.partial().parse(req.body);
  const { createFamily, familyName, familyId, dateOfBirth, ...rest } = data;

  let familyDbId = familyId !== undefined ? familyId : undefined;
  if (createFamily) {
    const famCode = await nextFamilyId();
    const fam = await prisma.family.create({
      data: { familyId: famCode, name: familyName || `${existing.fullName}'s Family` },
    });
    familyDbId = fam.id;
  }

  const patient = await prisma.patient.update({
    where: { id: existing.id },
    data: {
      ...rest,
      ...(familyDbId !== undefined ? { familyId: familyDbId } : {}),
      ...(dateOfBirth !== undefined ? { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null, birthday: dateOfBirth ? new Date(dateOfBirth) : null } : {}),
    },
    include: { family: true },
  });

  await logActivity(req, 'UPDATE_PATIENT', 'Patient', patient.id, null);
  res.json({ success: true, patient });
}));

router.post('/:id/photo', authorize('DOCTOR', 'RECEPTIONIST'), upload.single('photo'), asyncHandler(async (req, res) => {
  const existing = await prisma.patient.findFirst({
    where: { id: req.params.id, clinicId: req.user.clinicId },
  });
  if (!existing) throw new AppError('Patient not found', 404);
  if (!req.file) throw new AppError('No file uploaded');

  const photoUrl = `/uploads/${req.file.filename}`;
  const patient = await prisma.patient.update({
    where: { id: existing.id },
    data: { photoUrl },
  });
  res.json({ success: true, patient });
}));

router.get('/:id/timeline', asyncHandler(async (req, res) => {
  const patient = await prisma.patient.findFirst({
    where: { id: req.params.id, clinicId: req.user.clinicId },
  });
  if (!patient) throw new AppError('Patient not found', 404);

  const [cases, prescriptions, followUps, appointments] = await Promise.all([
    prisma.caseRecord.findMany({ where: { patientId: patient.id }, orderBy: { visitDate: 'desc' } }),
    prisma.prescription.findMany({ where: { patientId: patient.id }, include: { items: true }, orderBy: { visitDate: 'desc' } }),
    prisma.followUp.findMany({ where: { patientId: patient.id }, orderBy: { visitDate: 'desc' } }),
    prisma.appointment.findMany({ where: { patientId: patient.id }, orderBy: { date: 'desc' } }),
  ]);

  const timeline = [
    ...cases.map((c) => ({ type: 'CASE', date: c.visitDate, data: c })),
    ...prescriptions.map((p) => ({ type: 'PRESCRIPTION', date: p.visitDate, data: p })),
    ...followUps.map((f) => ({ type: 'FOLLOW_UP', date: f.visitDate, data: f })),
    ...appointments.map((a) => ({ type: 'APPOINTMENT', date: a.date, data: a })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({ success: true, timeline });
}));

router.get('/:id/export', asyncHandler(async (req, res) => {
  const patient = await prisma.patient.findFirst({
    where: { id: req.params.id, clinicId: req.user.clinicId },
    include: {
      caseRecords: true,
      prescriptions: { include: { items: true } },
      followUps: true,
      invoices: true,
    },
  });
  if (!patient) throw new AppError('Patient not found', 404);
  await logActivity(req, 'EXPORT_PATIENT', 'Patient', patient.id, null);
  res.json({ success: true, export: patient, exportedAt: new Date().toISOString() });
}));

module.exports = router;
