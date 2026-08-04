const express = require('express');
const { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, format, addDays } = require('date-fns');
const prisma = require('../utils/prisma');
const { asyncHandler } = require('../utils/errors');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/overview', asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [todayPatients, todayCollection, monthPatients, monthRevenue, totalPatients, pendingInvoices] = await Promise.all([
    prisma.appointment.count({
      where: { clinicId, date: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.invoice.aggregate({
      where: { clinicId, visitDate: { gte: dayStart, lte: dayEnd } },
      _sum: { paidAmount: true },
    }),
    prisma.appointment.count({
      where: { clinicId, date: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.invoice.aggregate({
      where: { clinicId, visitDate: { gte: monthStart, lte: monthEnd } },
      _sum: { paidAmount: true },
    }),
    prisma.patient.count({ where: { clinicId } }),
    prisma.invoice.count({ where: { clinicId, status: { in: ['PENDING', 'PARTIAL'] } } }),
  ]);

  // Low stock: items where quantity <= reorderLevel
  const inventory = await prisma.inventoryItem.findMany({ where: { clinicId } });
  const lowStockCount = inventory.filter((i) => i.quantity <= i.reorderLevel).length;

  const todayStart = startOfDay(now);
  const dueWindowEnd = endOfDay(addDays(todayStart, 15));
  const dueFollowUps = await prisma.followUp.count({
    where: {
      reminderSent: false,
      nextVisitDue: { not: null, gte: todayStart, lte: dueWindowEnd },
      patient: { clinicId },
    },
  });

  const repertorizationCount = req.user.role === 'DOCTOR'
    ? await prisma.repertorizationSession.count({ where: { clinicId } })
    : 0;

  res.json({
    success: true,
    overview: {
      todayPatients,
      todayCollection: todayCollection._sum.paidAmount || 0,
      monthPatients,
      monthRevenue: monthRevenue._sum.paidAmount || 0,
      totalPatients,
      pendingInvoices,
      lowStockCount,
      repertorizationCount,
      dueFollowUps,
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
