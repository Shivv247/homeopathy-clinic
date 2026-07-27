const express = require('express');
const { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, format } = require('date-fns');
const prisma = require('../utils/prisma');
const { asyncHandler } = require('../utils/errors');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/overview', asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  const now = new Date();

  const [
    todayAppointments,
    todayCompleted,
    totalPatients,
    newPatientsMonth,
    todayInvoices,
    lowStock,
    birthdays,
  ] = await Promise.all([
    prisma.appointment.count({
      where: { clinicId, date: { gte: startOfDay(now), lte: endOfDay(now) } },
    }),
    prisma.appointment.count({
      where: {
        clinicId,
        date: { gte: startOfDay(now), lte: endOfDay(now) },
        status: 'COMPLETED',
      },
    }),
    prisma.patient.count({ where: { clinicId } }),
    prisma.patient.count({
      where: {
        clinicId,
        tag: 'NEW',
        createdAt: { gte: startOfMonth(now), lte: endOfMonth(now) },
      },
    }),
    prisma.invoice.findMany({
      where: { clinicId, visitDate: { gte: startOfDay(now), lte: endOfDay(now) } },
    }),
    prisma.inventoryItem.findMany({ where: { clinicId } }).then((items) =>
      items.filter((i) => i.quantity <= i.reorderLevel).length
    ),
    prisma.patient.findMany({
      where: { clinicId },
      select: { id: true, fullName: true, phone: true, birthday: true, dateOfBirth: true },
    }).then((patients) => {
      const m = now.getMonth();
      const d = now.getDate();
      return patients.filter((p) => {
        const b = p.birthday || p.dateOfBirth;
        if (!b) return false;
        const bd = new Date(b);
        return bd.getMonth() === m && bd.getDate() === d;
      }).slice(0, 10);
    }),
  ]);

  const todayCollection = todayInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const todayNew = await prisma.appointment.count({
    where: {
      clinicId,
      date: { gte: startOfDay(now), lte: endOfDay(now) },
      type: { in: ['NEW', 'WALK_IN'] },
    },
  });
  const todayFollowUp = await prisma.appointment.count({
    where: {
      clinicId,
      date: { gte: startOfDay(now), lte: endOfDay(now) },
      type: 'FOLLOW_UP',
    },
  });

  res.json({
    success: true,
    overview: {
      todayPatients: todayAppointments,
      todayCompleted,
      todayNew,
      todayFollowUp,
      totalPatients,
      newPatientsMonth,
      todayCollection,
      lowStockCount: lowStock,
      birthdays,
    },
  });
}));

router.get('/analytics', authorize('DOCTOR'), asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  const now = new Date();

  // Monthly patient trend (last 6 months)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const count = await prisma.patient.count({
      where: {
        clinicId,
        createdAt: { gte: startOfMonth(monthDate), lte: endOfMonth(monthDate) },
      },
    });
    const revenue = await prisma.invoice.aggregate({
      where: {
        clinicId,
        visitDate: { gte: startOfMonth(monthDate), lte: endOfMonth(monthDate) },
      },
      _sum: { paidAmount: true },
    });
    monthlyTrend.push({
      month: format(monthDate, 'MMM yyyy'),
      patients: count,
      revenue: revenue._sum.paidAmount || 0,
    });
  }

  // Top remedies
  const allItems = await prisma.prescriptionItem.findMany({
    include: { prescription: { include: { patient: true } } },
  });
  const remedyCounts = {};
  allItems.forEach((item) => {
    if (item.prescription.patient.clinicId !== clinicId) return;
    remedyCounts[item.remedyName] = (remedyCounts[item.remedyName] || 0) + 1;
  });
  const topRemedies = Object.entries(remedyCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Common diagnoses
  const cases = await prisma.caseRecord.findMany({
    where: { patient: { clinicId } },
    select: { provisionalDiagnosis: true },
  });
  const diagCounts = {};
  cases.forEach((c) => {
    if (!c.provisionalDiagnosis) return;
    const key = c.provisionalDiagnosis.trim();
    diagCounts[key] = (diagCounts[key] || 0) + 1;
  });
  const topComplaints = Object.entries(diagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  res.json({
    success: true,
    analytics: { monthlyTrend, topRemedies, topComplaints },
  });
}));

module.exports = router;
