const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { asyncHandler, AppError } = require('../utils/errors');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { uploadImage } = require('../services/cloudinary');

const router = express.Router({ mergeParams: true });
router.use(authenticate);

async function getPatient(clinicId, patientId) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
  });
  if (!patient) throw new AppError('Patient not found', 404);
  return patient;
}

router.get('/', asyncHandler(async (req, res) => {
  await getPatient(req.user.clinicId, req.params.patientId);
  const reports = await prisma.attachment.findMany({
    where: { patientId: req.params.patientId, category: 'REPORT' },
    orderBy: { uploadedAt: 'desc' },
  });
  res.json({ success: true, reports });
}));

const reportSchema = z.object({
  tag: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

router.post(
  '/',
  authorize('DOCTOR', 'RECEPTIONIST'),
  upload.single('image'),
  asyncHandler(async (req, res) => {
    await getPatient(req.user.clinicId, req.params.patientId);
    if (!req.file) throw new AppError('No image uploaded');

    const data = reportSchema.parse(req.body);
    const { url } = await uploadImage(req.file);

    const report = await prisma.attachment.create({
      data: {
        patientId: req.params.patientId,
        fileName: req.file.originalname,
        fileUrl: url,
        fileType: req.file.mimetype,
        category: 'REPORT',
        tag: data.tag || null,
        notes: data.notes || null,
      },
    });

    res.status(201).json({ success: true, report });
  })
);

router.delete('/:reportId', authorize('DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
  await getPatient(req.user.clinicId, req.params.patientId);
  const report = await prisma.attachment.findFirst({
    where: {
      id: req.params.reportId,
      patientId: req.params.patientId,
      category: 'REPORT',
    },
  });
  if (!report) throw new AppError('Report not found', 404);
  await prisma.attachment.delete({ where: { id: report.id } });
  res.json({ success: true });
}));

module.exports = router;
