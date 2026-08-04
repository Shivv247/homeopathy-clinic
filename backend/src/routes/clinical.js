const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { authenticate, authorize, logActivity } = require('../middleware/auth');
const { asyncHandler } = require('../utils/errors');
const clinical = require('../services/clinical');

const router = express.Router();

router.use(authenticate);
router.use(authorize('DOCTOR'));

router.get('/stats', (_req, res) => {
  res.json({ success: true, stats: clinical.getStats() });
});

router.get('/search', (req, res) => {
  const q = req.query.q || '';
  res.json({ success: true, results: clinical.searchAll(q) });
});

router.get('/repertory/rubrics', (req, res) => {
  const { q, chapter, limit } = req.query;
  const rubrics = clinical.searchRubrics(q, chapter, limit ? Number(limit) : 40);
  res.json({ success: true, rubrics });
});

router.get('/repertory/chapters', (_req, res) => {
  const { chapterList } = clinical.getStats();
  res.json({ success: true, chapters: chapterList });
});

router.post('/repertory/analyze', (req, res) => {
  const schema = z.object({ rubricIds: z.array(z.string()).min(1).max(25) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Select at least one rubric' });
  }
  const analysis = clinical.repertorize(parsed.data.rubricIds);
  res.json({ success: true, analysis });
});

router.post('/repertory/from-symptoms', (req, res) => {
  const schema = z.object({ symptoms: z.string().min(3) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Enter symptoms to analyze' });
  }
  const rubrics = clinical.symptomsToRubrics(parsed.data.symptoms);
  res.json({ success: true, rubrics });
});

router.get('/acute-kits', (_req, res) => {
  res.json({ success: true, kits: clinical.listAcuteKits() });
});

router.get('/acute-kits/:id', (req, res) => {
  const kit = clinical.getAcuteKit(req.params.id);
  if (!kit) return res.status(404).json({ success: false, message: 'Kit not found' });
  res.json({ success: true, kit });
});

router.get('/materia-medica/list/all', (_req, res) => {
  res.json({ success: true, remedies: clinical.listAllMateriaMedica() });
});

router.post('/materia-medica/compare', (req, res) => {
  const schema = z.object({ slugs: z.array(z.string()).min(2).max(3) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Select 2–3 remedies to compare' });
  }
  const remedies = clinical.compareRemedies(parsed.data.slugs);
  res.json({ success: true, remedies });
});

router.get('/materia-medica', (req, res) => {
  const remedies = clinical.searchMateriaMedica(req.query.q, req.query.limit ? Number(req.query.limit) : 30);
  res.json({ success: true, remedies });
});

router.get('/materia-medica/:slug', (req, res) => {
  const remedy = clinical.getMateriaMedicaBySlug(req.params.slug);
  if (!remedy) return res.status(404).json({ success: false, message: 'Remedy not found' });
  res.json({ success: true, remedy });
});

router.get('/books', (_req, res) => {
  res.json({ success: true, books: clinical.listBooks() });
});

router.get('/books/:slug', (req, res) => {
  const book = clinical.getBook(req.params.slug);
  if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
  res.json({ success: true, book });
});

// ── Repertorization sessions (saved to patient record) ──

router.get('/sessions', asyncHandler(async (req, res) => {
  const { patientId } = req.query;
  const sessions = await prisma.repertorizationSession.findMany({
    where: {
      clinicId: req.user.clinicId,
      ...(patientId ? { patientId } : {}),
    },
    include: { patient: { select: { id: true, fullName: true, uhid: true } }, author: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ success: true, sessions });
}));

router.post('/sessions', asyncHandler(async (req, res) => {
  const schema = z.object({
    patientId: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    rubricIds: z.array(z.string()).min(1),
    topRemedies: z.array(z.unknown()).optional(),
    notes: z.string().optional().nullable(),
  });
  const data = schema.parse(req.body);

  if (data.patientId) {
    const patient = await prisma.patient.findFirst({
      where: { id: data.patientId, clinicId: req.user.clinicId },
    });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  const session = await prisma.repertorizationSession.create({
    data: {
      clinicId: req.user.clinicId,
      patientId: data.patientId || null,
      authorId: req.user.id,
      title: data.title || null,
      rubricIds: JSON.stringify(data.rubricIds),
      topRemedies: data.topRemedies ? JSON.stringify(data.topRemedies) : null,
      notes: data.notes || null,
    },
    include: { patient: { select: { fullName: true, uhid: true } } },
  });

  await logActivity(req, 'REPERTORIZATION_SAVED', 'RepertorizationSession', session.id, data.title);
  res.status(201).json({ success: true, session });
}));

router.get('/sessions/:id', asyncHandler(async (req, res) => {
  const session = await prisma.repertorizationSession.findFirst({
    where: { id: req.params.id, clinicId: req.user.clinicId },
    include: { patient: true, author: { select: { name: true } } },
  });
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
  res.json({
    success: true,
    session: {
      ...session,
      rubricIds: JSON.parse(session.rubricIds),
      topRemedies: session.topRemedies ? JSON.parse(session.topRemedies) : null,
    },
  });
}));

module.exports = router;
