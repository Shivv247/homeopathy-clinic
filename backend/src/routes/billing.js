const express = require('express');
const { z } = require('zod');
const { startOfDay, endOfDay, startOfMonth, endOfMonth, parseISO } = require('date-fns');
const prisma = require('../utils/prisma');
const { asyncHandler, AppError } = require('../utils/errors');
const { authenticate, authorize, logActivity } = require('../middleware/auth');
const { nextInvoiceNo } = require('../utils/counters');

const router = express.Router();
router.use(authenticate);

const invoiceSchema = z.object({
  patientId: z.string(),
  consultationFee: z.number().optional(),
  medicineCharge: z.number().optional(),
  discount: z.number().optional(),
  paidAmount: z.number().optional(),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'PENDING']).optional(),
  notes: z.string().optional().nullable(),
  visitType: z.enum(['NEW', 'FOLLOW_UP']).optional(),
});

router.get('/', authorize('DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
  const { date, status, outstanding } = req.query;
  const where = { clinicId: req.user.clinicId };
  if (date) {
    const d = parseISO(date);
    where.visitDate = { gte: startOfDay(d), lte: endOfDay(d) };
  }
  if (status) where.status = status;
  if (outstanding === 'true') {
    where.status = { in: ['PENDING', 'PARTIAL'] };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: { patient: { select: { id: true, fullName: true, uhid: true, phone: true } } },
    orderBy: { visitDate: 'desc' },
    take: 100,
  });
  res.json({ success: true, invoices });
}));

router.get('/summary/daily', authorize('DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
  const date = req.query.date ? parseISO(req.query.date) : new Date();
  const invoices = await prisma.invoice.findMany({
    where: {
      clinicId: req.user.clinicId,
      visitDate: { gte: startOfDay(date), lte: endOfDay(date) },
    },
  });
  const collected = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const billed = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const byMode = {};
  invoices.forEach((i) => {
    const m = i.paymentMode || 'PENDING';
    byMode[m] = (byMode[m] || 0) + i.paidAmount;
  });
  res.json({
    success: true,
    summary: { date, count: invoices.length, billed, collected, outstanding: billed - collected, byMode },
  });
}));

router.get('/summary/monthly', authorize('DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
  const date = req.query.date ? parseISO(req.query.date) : new Date();
  const invoices = await prisma.invoice.findMany({
    where: {
      clinicId: req.user.clinicId,
      visitDate: { gte: startOfMonth(date), lte: endOfMonth(date) },
    },
  });
  const collected = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const billed = invoices.reduce((s, i) => s + i.totalAmount, 0);
  res.json({
    success: true,
    summary: { month: date.getMonth() + 1, year: date.getFullYear(), count: invoices.length, billed, collected },
  });
}));

router.post('/', authorize('DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
  const data = invoiceSchema.parse(req.body);
  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, clinicId: req.user.clinicId },
  });
  if (!patient) throw new AppError('Patient not found', 404);

  const clinic = req.user.clinic;
  let consultationFee = data.consultationFee;
  if (consultationFee === undefined) {
    consultationFee = data.visitType === 'FOLLOW_UP'
      ? clinic.consultationFeeFollowUp
      : clinic.consultationFeeNew;
  }
  const medicineCharge = data.medicineCharge || 0;
  const discount = data.discount || 0;
  const totalAmount = Math.max(0, consultationFee + medicineCharge - discount);
  const paidAmount = data.paidAmount ?? 0;
  let status = 'PENDING';
  if (paidAmount >= totalAmount && totalAmount > 0) status = 'PAID';
  else if (paidAmount > 0) status = 'PARTIAL';
  if (data.paymentMode === 'PENDING') status = paidAmount > 0 ? 'PARTIAL' : 'PENDING';

  const invoiceNo = await nextInvoiceNo(req.user.clinicId);
  const invoice = await prisma.invoice.create({
    data: {
      clinicId: req.user.clinicId,
      patientId: patient.id,
      invoiceNo,
      consultationFee,
      medicineCharge,
      discount,
      totalAmount,
      paidAmount,
      paymentMode: data.paymentMode || (paidAmount > 0 ? 'CASH' : 'PENDING'),
      status,
      notes: data.notes,
    },
    include: { patient: true },
  });

  await logActivity(req, 'CREATE_INVOICE', 'Invoice', invoice.id, { invoiceNo, totalAmount });
  res.status(201).json({ success: true, invoice });
}));

router.patch('/:id/payment', authorize('DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
  const { paidAmount, paymentMode } = req.body;
  const existing = await prisma.invoice.findFirst({
    where: { id: req.params.id, clinicId: req.user.clinicId },
  });
  if (!existing) throw new AppError('Invoice not found', 404);

  const newPaid = paidAmount !== undefined ? paidAmount : existing.paidAmount;
  let status = 'PENDING';
  if (newPaid >= existing.totalAmount) status = 'PAID';
  else if (newPaid > 0) status = 'PARTIAL';

  const invoice = await prisma.invoice.update({
    where: { id: existing.id },
    data: {
      paidAmount: newPaid,
      paymentMode: paymentMode || existing.paymentMode,
      status,
    },
    include: { patient: true },
  });
  res.json({ success: true, invoice });
}));

module.exports = router;
