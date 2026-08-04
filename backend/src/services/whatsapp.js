const prisma = require('../utils/prisma');

/**
 * WhatsApp Cloud API / Twilio stub.
 * Set WHATSAPP_ENABLED=true and credentials in .env to send real messages.
 */
async function sendWhatsApp({ phone, body, template, patientId }) {
  const log = await prisma.messageLog.create({
    data: {
      patientId: patientId || null,
      phone,
      channel: 'WHATSAPP',
      template: template || null,
      body,
      status: 'PENDING',
    },
  });

  if (process.env.WHATSAPP_ENABLED !== 'true') {
    console.log(`[WhatsApp STUB] → ${phone}: ${body.slice(0, 80)}...`);
    await prisma.messageLog.update({
      where: { id: log.id },
      data: { status: 'SENT' },
    });
    return { success: true, stub: true, logId: log.id };
  }

  try {
    const url = `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone.replace(/\D/g, ''),
        type: 'text',
        text: { body },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      await prisma.messageLog.update({
        where: { id: log.id },
        data: { status: 'FAILED', error: err },
      });
      return { success: false, error: err };
    }
    await prisma.messageLog.update({
      where: { id: log.id },
      data: { status: 'SENT' },
    });
    return { success: true, logId: log.id };
  } catch (e) {
    await prisma.messageLog.update({
      where: { id: log.id },
      data: { status: 'FAILED', error: e.message },
    });
    return { success: false, error: e.message };
  }
}

function prescriptionMessage(clinic, patient, prescription) {
  const lines = [
    `Namaste ${patient.fullName},`,
    ``,
    `Your prescription from ${clinic.name}:`,
    `Rx No: ${prescription.prescriptionNo}`,
    `Date: ${new Date(prescription.visitDate).toLocaleDateString('en-IN')}`,
    prescription.specialInstructions ? `Instructions: ${prescription.specialInstructions}` : '',
    prescription.nextVisitDays ? `Next visit in ${prescription.nextVisitDays} days.` : '',
    ``,
    `— ${clinic.doctorName || 'Doctor'}`,
  ].filter(Boolean);
  return lines.join('\n');
}

function appointmentReminder(clinic, patient, appointment) {
  return `Namaste ${patient.fullName},\nReminder: Your appointment at ${clinic.name} is on ${new Date(appointment.date).toLocaleDateString('en-IN')}${appointment.timeSlot ? ` at ${appointment.timeSlot}` : ''}.\nToken: ${appointment.tokenNumber || '—'}\nPlease arrive on time.`;
}

function followUpReminder(clinic, patient, days) {
  const duePart =
    days === 0
      ? 'your follow-up visit is due today'
      : days === 1
        ? 'your follow-up visit is tomorrow'
        : `your follow-up visit is due in ${days} days`;
  return `Namaste ${patient.fullName},\nThis is a gentle reminder from ${clinic.name} — ${duePart}. Please book or walk in at your convenience.\n— ${clinic.doctorName || 'Doctor'}`;
}

module.exports = {
  sendWhatsApp,
  prescriptionMessage,
  appointmentReminder,
  followUpReminder,
};
