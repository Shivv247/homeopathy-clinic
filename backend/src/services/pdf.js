const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generatePrescriptionPdf({ clinic, patient, prescription, items, outputPath }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Letterhead
    doc.fontSize(18).fillColor('#1a5f4a').text(clinic.name || 'Homeopathy Clinic', { align: 'center' });
    if (clinic.address) {
      doc.fontSize(9).fillColor('#555').text(clinic.address, { align: 'center' });
    }
    if (clinic.phone) {
      doc.fontSize(9).text(`Ph: ${clinic.phone}`, { align: 'center' });
    }
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#1a5f4a').text(clinic.doctorName || 'Doctor', { align: 'center' });
    if (clinic.doctorRegNumber) {
      doc.fontSize(9).fillColor('#666').text(`Reg. No: ${clinic.doctorRegNumber}`, { align: 'center' });
    }
    doc.moveDown(0.5);
    doc.strokeColor('#1a5f4a').lineWidth(1.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    doc.fontSize(14).fillColor('#000').text('PRESCRIPTION', { align: 'center', underline: true });
    doc.moveDown();

    doc.fontSize(10).fillColor('#333');
    doc.text(`Rx No: ${prescription.prescriptionNo}`);
    doc.text(`Date: ${new Date(prescription.visitDate).toLocaleDateString('en-IN')}`);
    doc.text(`Patient: ${patient.fullName}  |  UHID: ${patient.uhid}`);
    doc.text(`Age/Sex: ${patient.ageYears || '—'} / ${patient.gender || '—'}  |  Phone: ${patient.phone}`);
    doc.moveDown();
    doc.strokeColor('#ccc').lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    doc.fontSize(12).fillColor('#1a5f4a').text('Rx', { continued: false });
    doc.moveDown(0.5);

    items.forEach((item, i) => {
      doc.fontSize(11).fillColor('#000')
        .text(`${i + 1}. ${item.remedyName}${item.potency ? ` ${item.potency}` : ''}`, { continued: false });
      const details = [
        item.dosage && `Dose: ${item.dosage}`,
        item.frequency && `Freq: ${item.frequency}`,
        item.duration && `Duration: ${item.duration}`,
      ].filter(Boolean).join('  ·  ');
      if (details) doc.fontSize(9).fillColor('#444').text(`   ${details}`);
      if (item.instructions) doc.fontSize(9).fillColor('#666').text(`   Note: ${item.instructions}`);
      doc.moveDown(0.4);
    });

    if (prescription.specialInstructions) {
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#000').text('Special Instructions:', { underline: true });
      doc.fontSize(9).fillColor('#333').text(prescription.specialInstructions);
    }

    if (prescription.nextVisitDays) {
      doc.moveDown();
      doc.fontSize(10).fillColor('#1a5f4a')
        .text(`Next visit: after ${prescription.nextVisitDays} days`);
    }

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#888').text('— End of Prescription —', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(10).fillColor('#000').text('________________________', { align: 'right' });
    doc.fontSize(9).text(clinic.doctorName || 'Doctor', { align: 'right' });

    doc.end();
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

function generateInvoicePdf({ clinic, patient, invoice, outputPath }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    doc.fontSize(18).fillColor('#1a5f4a').text(clinic.name || 'Clinic', { align: 'center' });
    doc.fontSize(14).fillColor('#000').text('INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Invoice No: ${invoice.invoiceNo}`);
    doc.text(`Date: ${new Date(invoice.visitDate).toLocaleDateString('en-IN')}`);
    doc.text(`Patient: ${patient.fullName} (${patient.uhid})`);
    doc.moveDown();
    doc.text(`Consultation Fee: ₹${invoice.consultationFee.toFixed(2)}`);
    doc.text(`Medicine Charge: ₹${invoice.medicineCharge.toFixed(2)}`);
    if (invoice.discount) doc.text(`Discount: ₹${invoice.discount.toFixed(2)}`);
    doc.moveDown(0.3);
    doc.fontSize(12).text(`Total: ₹${invoice.totalAmount.toFixed(2)}`);
    doc.fontSize(10).text(`Paid: ₹${invoice.paidAmount.toFixed(2)} (${invoice.paymentMode || '—'})`);
    doc.text(`Status: ${invoice.status}`);
    doc.end();
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

module.exports = { generatePrescriptionPdf, generateInvoicePdf };
