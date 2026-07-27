const express = require('express');
const path = require('path');
const fs = require('fs');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { asyncHandler, AppError } = require('../utils/errors');
const { authenticate, doctorOnly, authorize, logActivity } = require('../middleware/auth');
const { nextPrescriptionNo } = require('../utils/counters');
const { generatePrescriptionPdf } = require('../services/pdf');
const { sendWhatsApp, prescriptionMessage } = require('../services/whatsapp');

const router = express.Router();
router.use(authenticate);

const itemSchema = z.object({
  remedyId: z.string().optional().nullable(),
  remedyName: z.string().min(1),
  potency: z.string().optional().nullable(),
  dosage: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  quantity: z.number().optional(),
});

const rxSchema = z.object({
  patientId: z.string(),
  caseRecordId: z.string().optional().nullable(),
  specialInstructions: z.string().optional().nullable(),
  nextVisitDays: z.number().int().optional().nullable(),
  items: z.array(itemSchema).min(1),
  deductStock: z.boolean().optional(),
});

router.get('/remedies', asyncHandler(async (req, res) => {
  const { q } = req.query;
  const where = q
    ? { OR: [{ name: { contains: q } }, { commonName: { contains: q } }] }
    : {};
  const remedies = await prisma.remedy.findMany({
    where,
    orderBy: { name: 'asc' },
    take: 50,
  });
  res.json({
    success: true,
    remedies: remedies.map((r) => ({
      ...r,
      potencies: (() => { try { return JSON.parse(r.potencies); } catch { return []; } })(),
    })),
  });
}));

router.get('/patient/:patientId', asyncHandler(async (req, res) => {
  const patient = await prisma.patient.findFirst({
    where: { id: req.params.patientId, clinicId: req.user.clinicId },
  });
  if (!patient) throw new AppError('Patient not found', 404);
  const prescriptions = await prisma.prescription.findMany({
    where: { patientId: patient.id },
    include: { items: true, author: { select: { name: true } } },
    orderBy: { visitDate: 'desc' },
  });
  res.json({ success: true, prescriptions });
}));

router.get('/patient/:patientId/last', asyncHandler(async (req, res) => {
  const patient = await prisma.patient.findFirst({
    where: { id: req.params.patientId, clinicId: req.user.clinicId },
  });
  if (!patient) throw new AppError('Patient not found', 404);
  const last = await prisma.prescription.findFirst({
    where: { patientId: patient.id },
    include: { items: true },
    orderBy: { visitDate: 'desc' },
  });
  res.json({ success: true, prescription: last });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id: req.params.id },
    include: { items: true, patient: true, author: { select: { name: true } } },
  });
  if (!prescription || prescription.patient.clinicId !== req.user.clinicId) {
    throw new AppError('Prescription not found', 404);
  }
  res.json({ success: true, prescription });
}));

router.post('/', doctorOnly, asyncHandler(async (req, res) => {
  const data = rxSchema.parse(req.body);
  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, clinicId: req.user.clinicId },
  });
  if (!patient) throw new AppError('Patient not found', 404);

  const prescriptionNo = await nextPrescriptionNo(req.user.clinicId);
  const prescription = await prisma.prescription.create({
    data: {
      patientId: patient.id,
      caseRecordId: data.caseRecordId || null,
      authorId: req.user.id,
      prescriptionNo,
      specialInstructions: data.specialInstructions,
      nextVisitDays: data.nextVisitDays,
      items: {
        create: data.items.map((i) => ({
          remedyId: i.remedyId || null,
          remedyName: i.remedyName,
          potency: i.potency,
          dosage: i.dosage,
          frequency: i.frequency,
          duration: i.duration,
          instructions: i.instructions,
          quantity: i.quantity || 1,
        })),
      },
    },
    include: { items: true },
  });

  if (data.deductStock) {
    for (const item of data.items) {
      if (!item.remedyId) continue;
      const inv = await prisma.inventoryItem.findFirst({
        where: { clinicId: req.user.clinicId, remedyId: item.remedyId },
      });
      if (inv) {
        const qty = item.quantity || 1;
        await prisma.inventoryItem.update({
          where: { id: inv.id },
          data: { quantity: Math.max(0, inv.quantity - qty) },
        });
        await prisma.stockLog.create({
          data: {
            inventoryItemId: inv.id,
            type: 'DISPENSE',
            quantity: -qty,
            notes: `Rx ${prescriptionNo}`,
          },
        });
      }
    }
  }

  await logActivity(req, 'CREATE_PRESCRIPTION', 'Prescription', prescription.id, { prescriptionNo });
  res.status(201).json({ success: true, prescription });
}));

router.post('/:id/pdf', authorize('DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id: req.params.id },
    include: { items: true, patient: true },
  });
  if (!prescription || prescription.patient.clinicId !== req.user.clinicId) {
    throw new AppError('Prescription not found', 404);
  }

  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const pdfDir = path.join(uploadDir, 'pdfs');
  if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
  const filename = `${prescription.prescriptionNo}.pdf`;
  const outputPath = path.join(pdfDir, filename);

  await generatePrescriptionPdf({
    clinic: req.user.clinic,
    patient: prescription.patient,
    prescription,
    items: prescription.items,
    outputPath,
  });

  const pdfUrl = `/uploads/pdfs/${filename}`;
  await prisma.prescription.update({
    where: { id: prescription.id },
    data: { pdfUrl },
  });

  res.json({ success: true, pdfUrl });
}));

router.post('/:id/whatsapp', authorize('DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id: req.params.id },
    include: { items: true, patient: true },
  });
  if (!prescription || prescription.patient.clinicId !== req.user.clinicId) {
    throw new AppError('Prescription not found', 404);
  }

  const body = prescriptionMessage(req.user.clinic, prescription.patient, prescription);
  const result = await sendWhatsApp({
    phone: prescription.patient.phone,
    body,
    template: 'prescription',
    patientId: prescription.patientId,
  });

  if (result.success) {
    await prisma.prescription.update({
      where: { id: prescription.id },
      data: { whatsappSent: true },
    });
  }

  res.json({ success: result.success, result });
}));

module.exports = router;
