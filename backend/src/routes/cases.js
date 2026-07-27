const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { asyncHandler, AppError } = require('../utils/errors');
const { authenticate, doctorOnly, logActivity } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();
router.use(authenticate);

const caseSchema = z.object({
  patientId: z.string(),
  visitType: z.enum(['NEW', 'FOLLOW_UP']).optional(),
  visitDate: z.string().optional(),
  chiefComplaints: z.any().optional(),
  physicalGenerals: z.any().optional(),
  mentalGenerals: z.any().optional(),
  pastHistory: z.any().optional(),
  physicalExam: z.any().optional(),
  provisionalDiagnosis: z.string().optional().nullable(),
  miasm: z.string().optional().nullable(),
  doctorObservation: z.string().optional().nullable(),
  improvementStatus: z.string().optional().nullable(),
  improvementPercent: z.number().int().min(0).max(100).optional().nullable(),
});

function stringify(v) {
  if (v === undefined || v === null) return null;
  return typeof v === 'string' ? v : JSON.stringify(v);
}

router.get('/patient/:patientId', asyncHandler(async (req, res) => {
  const patient = await prisma.patient.findFirst({
    where: { id: req.params.patientId, clinicId: req.user.clinicId },
  });
  if (!patient) throw new AppError('Patient not found', 404);

  const cases = await prisma.caseRecord.findMany({
    where: { patientId: patient.id },
    include: { author: { select: { id: true, name: true } }, attachments: true, prescriptions: { include: { items: true } } },
    orderBy: { visitDate: 'desc' },
  });
  res.json({ success: true, cases });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const caseRecord = await prisma.caseRecord.findUnique({
    where: { id: req.params.id },
    include: {
      patient: true,
      author: { select: { id: true, name: true } },
      attachments: true,
      prescriptions: { include: { items: true } },
      followUps: true,
    },
  });
  if (!caseRecord || caseRecord.patient.clinicId !== req.user.clinicId) {
    throw new AppError('Case not found', 404);
  }
  // Parse JSON fields for frontend convenience
  const parsed = {
    ...caseRecord,
    chiefComplaints: safeParse(caseRecord.chiefComplaints),
    physicalGenerals: safeParse(caseRecord.physicalGenerals),
    mentalGenerals: safeParse(caseRecord.mentalGenerals),
    pastHistory: safeParse(caseRecord.pastHistory),
    physicalExam: safeParse(caseRecord.physicalExam),
  };
  res.json({ success: true, case: parsed });
}));

function safeParse(s) {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return s; }
}

router.post('/', doctorOnly, asyncHandler(async (req, res) => {
  const data = caseSchema.parse(req.body);
  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, clinicId: req.user.clinicId },
  });
  if (!patient) throw new AppError('Patient not found', 404);

  const caseRecord = await prisma.caseRecord.create({
    data: {
      patientId: patient.id,
      authorId: req.user.id,
      visitType: data.visitType || 'NEW',
      visitDate: data.visitDate ? new Date(data.visitDate) : new Date(),
      chiefComplaints: stringify(data.chiefComplaints),
      physicalGenerals: stringify(data.physicalGenerals),
      mentalGenerals: stringify(data.mentalGenerals),
      pastHistory: stringify(data.pastHistory),
      physicalExam: stringify(data.physicalExam),
      provisionalDiagnosis: data.provisionalDiagnosis,
      miasm: data.miasm,
      doctorObservation: data.doctorObservation,
      improvementStatus: data.improvementStatus,
      improvementPercent: data.improvementPercent,
      isLocked: true,
      version: 1,
    },
  });

  // Update patient tag to FOLLOW_UP after first case
  if (patient.tag === 'NEW') {
    await prisma.patient.update({ where: { id: patient.id }, data: { tag: 'FOLLOW_UP' } });
  }

  if (data.improvementStatus || data.visitType === 'FOLLOW_UP') {
    await prisma.followUp.create({
      data: {
        patientId: patient.id,
        caseRecordId: caseRecord.id,
        visitDate: caseRecord.visitDate,
        improvementStatus: data.improvementStatus,
        improvementPercent: data.improvementPercent,
        symptomsReported: data.doctorObservation,
      },
    });
  }

  await logActivity(req, 'CREATE_CASE', 'CaseRecord', caseRecord.id, { patientId: patient.id });
  res.status(201).json({ success: true, case: caseRecord });
}));

/** Edit creates a new version — audit trail preserved */
router.post('/:id/new-version', doctorOnly, asyncHandler(async (req, res) => {
  const previous = await prisma.caseRecord.findUnique({
    where: { id: req.params.id },
    include: { patient: true },
  });
  if (!previous || previous.patient.clinicId !== req.user.clinicId) {
    throw new AppError('Case not found', 404);
  }

  const data = caseSchema.partial().parse(req.body);
  const newCase = await prisma.caseRecord.create({
    data: {
      patientId: previous.patientId,
      authorId: req.user.id,
      parentCaseId: previous.id,
      version: previous.version + 1,
      visitType: data.visitType || previous.visitType,
      visitDate: data.visitDate ? new Date(data.visitDate) : new Date(),
      chiefComplaints: data.chiefComplaints !== undefined ? stringify(data.chiefComplaints) : previous.chiefComplaints,
      physicalGenerals: data.physicalGenerals !== undefined ? stringify(data.physicalGenerals) : previous.physicalGenerals,
      mentalGenerals: data.mentalGenerals !== undefined ? stringify(data.mentalGenerals) : previous.mentalGenerals,
      pastHistory: data.pastHistory !== undefined ? stringify(data.pastHistory) : previous.pastHistory,
      physicalExam: data.physicalExam !== undefined ? stringify(data.physicalExam) : previous.physicalExam,
      provisionalDiagnosis: data.provisionalDiagnosis !== undefined ? data.provisionalDiagnosis : previous.provisionalDiagnosis,
      miasm: data.miasm !== undefined ? data.miasm : previous.miasm,
      doctorObservation: data.doctorObservation !== undefined ? data.doctorObservation : previous.doctorObservation,
      improvementStatus: data.improvementStatus,
      improvementPercent: data.improvementPercent,
      isLocked: true,
    },
  });

  await logActivity(req, 'VERSION_CASE', 'CaseRecord', newCase.id, { previousId: previous.id, version: newCase.version });
  res.status(201).json({ success: true, case: newCase });
}));

router.post('/:id/attachments', doctorOnly, upload.single('file'), asyncHandler(async (req, res) => {
  const caseRecord = await prisma.caseRecord.findUnique({
    where: { id: req.params.id },
    include: { patient: true },
  });
  if (!caseRecord || caseRecord.patient.clinicId !== req.user.clinicId) {
    throw new AppError('Case not found', 404);
  }
  if (!req.file) throw new AppError('No file uploaded');

  const attachment = await prisma.attachment.create({
    data: {
      patientId: caseRecord.patientId,
      caseRecordId: caseRecord.id,
      fileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      category: req.body.category || 'REPORT',
    },
  });
  res.status(201).json({ success: true, attachment });
}));

module.exports = router;
