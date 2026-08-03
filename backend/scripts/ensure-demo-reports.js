const { PrismaClient } = require('@prisma/client');

const DEMO_SETS = [
  {
    tags: ['Skin — Before treatment', 'Skin — After 3 months'],
    urls: [
      'https://placehold.co/800x600/f0e4d8/6b4423?text=Skin+Before',
      'https://placehold.co/800x600/e4ede6/2f4f37?text=Skin+After+3+Months',
    ],
  },
  {
    tags: ['Eczema — Week 1', 'Eczema — Week 8'],
    urls: [
      'https://placehold.co/800x600/ffe8d6/c45c26?text=Eczema+Week+1',
      'https://placehold.co/800x600/d4e8d4/1e4620?text=Eczema+Week+8',
    ],
  },
  {
    tags: ['Thyroid report — Baseline', 'Thyroid report — Follow-up'],
    urls: [
      'https://placehold.co/800x600/e8eef5/1e3a5f?text=Thyroid+Baseline',
      'https://placehold.co/800x600/e8eef5/1e3a5f?text=Thyroid+Follow-up',
    ],
  },
];

async function ensureDemoReports(prisma) {
  const reportCount = await prisma.attachment.count({ where: { category: 'REPORT' } });
  if (reportCount > 0) return;

  const patients = await prisma.patient.findMany({ take: 3, orderBy: { createdAt: 'asc' } });
  if (!patients.length) return;

  console.log('📷 Adding demo report images for client presentation...');

  for (let i = 0; i < Math.min(patients.length, DEMO_SETS.length); i += 1) {
    const patient = patients[i];
    const set = DEMO_SETS[i];
    for (let j = 0; j < set.tags.length; j += 1) {
      await prisma.attachment.create({
        data: {
          patientId: patient.id,
          fileName: `demo-report-${i}-${j}.jpg`,
          fileUrl: set.urls[j],
          fileType: 'image/jpeg',
          category: 'REPORT',
          tag: set.tags[j],
          uploadedAt: new Date(Date.now() - (set.tags.length - j) * 60 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }
}

module.exports = { ensureDemoReports };
