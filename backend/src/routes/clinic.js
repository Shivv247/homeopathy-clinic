const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { asyncHandler, AppError } = require('../utils/errors');
const { authenticate, authorize, logActivity } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const clinic = await prisma.clinic.findUnique({ where: { id: req.user.clinicId } });
  res.json({
    success: true,
    clinic: {
      ...clinic,
      timings: clinic.timings ? (() => { try { return JSON.parse(clinic.timings); } catch { return clinic.timings; } })() : null,
    },
  });
}));

router.put('/', authorize('DOCTOR'), asyncHandler(async (req, res) => {
  const schema = z.object({
    name: z.string().optional(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    doctorName: z.string().optional().nullable(),
    doctorRegNumber: z.string().optional().nullable(),
    consultationFeeNew: z.number().optional(),
    consultationFeeFollowUp: z.number().optional(),
    timings: z.any().optional(),
    whatsappNumber: z.string().optional().nullable(),
  });
  const data = schema.parse(req.body);
  const { timings, ...rest } = data;
  const clinic = await prisma.clinic.update({
    where: { id: req.user.clinicId },
    data: {
      ...rest,
      ...(timings !== undefined ? { timings: typeof timings === 'string' ? timings : JSON.stringify(timings) } : {}),
    },
  });
  await logActivity(req, 'UPDATE_CLINIC', 'Clinic', clinic.id, null);
  res.json({ success: true, clinic });
}));

router.post('/logo', authorize('DOCTOR'), upload.single('logo'), asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded');
  const clinic = await prisma.clinic.update({
    where: { id: req.user.clinicId },
    data: { logoUrl: `/uploads/${req.file.filename}` },
  });
  res.json({ success: true, clinic });
}));

router.get('/activity', authorize('DOCTOR'), asyncHandler(async (req, res) => {
  const logs = await prisma.activityLog.findMany({
    where: { clinicId: req.user.clinicId },
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ success: true, logs });
}));

router.get('/users', authorize('DOCTOR'), asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { clinicId: req.user.clinicId },
    select: { id: true, name: true, phone: true, email: true, role: true, isActive: true, createdAt: true },
  });
  res.json({ success: true, users });
}));

module.exports = router;
