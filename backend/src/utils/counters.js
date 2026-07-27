const prisma = require('../utils/prisma');

async function nextUhid(clinicId) {
  const year = new Date().getFullYear();
  const prefix = `HC-${year}-`;
  const last = await prisma.patient.findFirst({
    where: { clinicId, uhid: { startsWith: prefix } },
    orderBy: { uhid: 'desc' },
  });
  let seq = 1;
  if (last?.uhid) {
    const n = parseInt(last.uhid.split('-').pop(), 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

async function nextFamilyId() {
  const last = await prisma.family.findFirst({ orderBy: { familyId: 'desc' } });
  let seq = 1;
  if (last?.familyId) {
    const n = parseInt(last.familyId.replace('FAM-', ''), 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }
  return `FAM-${String(seq).padStart(4, '0')}`;
}

async function nextPrescriptionNo(clinicId) {
  const year = new Date().getFullYear();
  const prefix = `RX-${year}-`;
  const last = await prisma.prescription.findFirst({
    where: { prescriptionNo: { startsWith: prefix } },
    orderBy: { prescriptionNo: 'desc' },
  });
  let seq = 1;
  if (last?.prescriptionNo) {
    const n = parseInt(last.prescriptionNo.split('-').pop(), 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

async function nextInvoiceNo(clinicId) {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const last = await prisma.invoice.findFirst({
    where: { clinicId, invoiceNo: { startsWith: prefix } },
    orderBy: { invoiceNo: 'desc' },
  });
  let seq = 1;
  if (last?.invoiceNo) {
    const n = parseInt(last.invoiceNo.split('-').pop(), 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

async function nextToken(clinicId, date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  const count = await prisma.appointment.count({
    where: { clinicId, date: { gte: start, lte: end } },
  });
  return count + 1;
}

module.exports = { nextUhid, nextFamilyId, nextPrescriptionNo, nextInvoiceNo, nextToken };
