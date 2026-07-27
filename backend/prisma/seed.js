require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const REMEDIES = [
  { name: 'Aconitum Napellus', commonName: 'Aconite', category: 'REMEDY', description: 'Sudden onset, fear, anxiety' },
  { name: 'Arsenicum Album', commonName: 'Arsenic', category: 'REMEDY', description: 'Restlessness, burning pains, anxiety about health' },
  { name: 'Belladonna', commonName: 'Deadly Nightshade', category: 'REMEDY', description: 'Sudden high fever, throbbing pains, redness' },
  { name: 'Bryonia Alba', commonName: 'Bryonia', category: 'REMEDY', description: 'Worse from motion, dryness, irritability' },
  { name: 'Calcarea Carbonica', commonName: 'Calc Carb', category: 'REMEDY', description: 'Slow, chilly, sweating head, anxiety' },
  { name: 'Chamomilla', commonName: 'Chamomile', category: 'REMEDY', description: 'Irritability, teething, pain intolerance' },
  { name: 'Gelsemium', commonName: 'Yellow Jasmine', category: 'REMEDY', description: 'Weakness, trembling, anticipatory anxiety' },
  { name: 'Ignatia Amara', commonName: 'Ignatia', category: 'REMEDY', description: 'Grief, sighing, contradictory symptoms' },
  { name: 'Lycopodium Clavatum', commonName: 'Lycopodium', category: 'REMEDY', description: 'Digestive issues, right-sided, lack of confidence' },
  { name: 'Natrum Muriaticum', commonName: 'Nat Mur', category: 'REMEDY', description: 'Grief, reserved, craving salt, headaches' },
  { name: 'Nux Vomica', commonName: 'Nux Vom', category: 'REMEDY', description: 'Irritable, sedentary, digestive complaints' },
  { name: 'Phosphorus', commonName: 'Phosphorus', category: 'REMEDY', description: 'Sympathetic, bleeding tendency, thirst for cold' },
  { name: 'Pulsatilla Nigricans', commonName: 'Pulsatilla', category: 'REMEDY', description: 'Changeable, mild, desires consolation, open air' },
  { name: 'Rhus Toxicodendron', commonName: 'Rhus Tox', category: 'REMEDY', description: 'Restless, worse first motion, better continued motion' },
  { name: 'Sepia Officinalis', commonName: 'Sepia', category: 'REMEDY', description: 'Indifference, hormonal, bearing-down pains' },
  { name: 'Sulphur', commonName: 'Sulphur', category: 'REMEDY', description: 'Burning, itching, philosophical, unclean' },
  { name: 'Thuja Occidentalis', commonName: 'Thuja', category: 'REMEDY', description: 'Warts, sycotic miasm, fixed ideas' },
  { name: 'Silicea', commonName: 'Silica', category: 'REMEDY', description: 'Chilly, stubborn, pus formation, weak nails' },
  { name: 'Hepar Sulphuris', commonName: 'Hepar Sulph', category: 'REMEDY', description: 'Hypersensitive to pain/cold, suppuration' },
  { name: 'Mercurius Solubilis', commonName: 'Merc Sol', category: 'REMEDY', description: 'Night sweats, salivation, offensive discharges' },
  { name: 'Ferrum Phosphoricum', commonName: 'Ferrum Phos', category: 'BIOCHEMIC', description: 'Early inflammation, anemia' },
  { name: 'Kali Muriaticum', commonName: 'Kali Mur', category: 'BIOCHEMIC', description: 'White discharges, congestion' },
  { name: 'Kali Phosphoricum', commonName: 'Kali Phos', category: 'BIOCHEMIC', description: 'Nervous exhaustion, mental fatigue' },
  { name: 'Magnesia Phosphorica', commonName: 'Mag Phos', category: 'BIOCHEMIC', description: 'Cramps, neuralgic pains, better heat' },
  { name: 'Natrum Phosphoricum', commonName: 'Nat Phos', category: 'BIOCHEMIC', description: 'Acidity, sourness' },
  { name: 'Calcarea Phosphorica', commonName: 'Calc Phos', category: 'BIOCHEMIC', description: 'Bone growth, teething, convalescence' },
  { name: 'Berberis Vulgaris Q', commonName: 'Berberis Q', category: 'MOTHER_TINCTURE', description: 'Kidney and urinary tract' },
  { name: 'Crataegus Oxycantha Q', commonName: 'Crataegus Q', category: 'MOTHER_TINCTURE', description: 'Heart tonic' },
  { name: 'Passiflora Incarnata Q', commonName: 'Passiflora Q', category: 'MOTHER_TINCTURE', description: 'Insomnia, restlessness' },
  { name: 'Syzygium Jambolanum Q', commonName: 'Syzygium Q', category: 'MOTHER_TINCTURE', description: 'Blood sugar support' },
];

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.messageLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.stockLog.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.caseRecord.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.family.deleteMany();
  await prisma.remedy.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clinic.deleteMany();

  const clinic = await prisma.clinic.create({
    data: {
      name: 'Healing Homeopathy Clinic',
      address: '12, Green Park Extension, Near Metro Station',
      city: 'New Delhi',
      phone: '9876543210',
      email: 'clinic@healinghomeopathy.in',
      doctorName: 'Dr. Ananya Sharma',
      doctorRegNumber: 'CCH-DL-2018-4521',
      consultationFeeNew: 600,
      consultationFeeFollowUp: 400,
      whatsappNumber: '9876543210',
      timings: JSON.stringify({
        mon: '10:00-14:00, 17:00-20:00',
        tue: '10:00-14:00, 17:00-20:00',
        wed: '10:00-14:00, 17:00-20:00',
        thu: '10:00-14:00, 17:00-20:00',
        fri: '10:00-14:00, 17:00-20:00',
        sat: '10:00-14:00',
        sun: 'Closed',
      }),
    },
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  const doctor = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      name: 'Dr. Ananya Sharma',
      phone: '9876543210',
      email: 'doctor@clinic.com',
      passwordHash,
      role: 'DOCTOR',
    },
  });

  await prisma.user.create({
    data: {
      clinicId: clinic.id,
      name: 'Priya Reception',
      phone: '9876543211',
      email: 'reception@clinic.com',
      passwordHash,
      role: 'RECEPTIONIST',
    },
  });

  await prisma.user.create({
    data: {
      clinicId: clinic.id,
      name: 'Ravi Assistant',
      phone: '9876543212',
      email: 'assistant@clinic.com',
      passwordHash,
      role: 'ASSISTANT',
    },
  });

  for (const r of REMEDIES) {
    await prisma.remedy.create({
      data: {
        name: r.name,
        commonName: r.commonName,
        category: r.category,
        description: r.description,
        potencies: r.category === 'MOTHER_TINCTURE'
          ? JSON.stringify(['Q', 'Ø'])
          : r.category === 'BIOCHEMIC'
            ? JSON.stringify(['6X', '12X', '30X'])
            : JSON.stringify(['6C', '30C', '200C', '1M', '10M']),
      },
    });
  }

  const remedies = await prisma.remedy.findMany();
  for (const r of remedies.slice(0, 12)) {
    await prisma.inventoryItem.create({
      data: {
        clinicId: clinic.id,
        remedyId: r.id,
        name: r.name,
        category: r.category,
        potency: r.category === 'BIOCHEMIC' ? '6X' : r.category === 'MOTHER_TINCTURE' ? 'Q' : '30C',
        quantity: Math.floor(Math.random() * 40) + 5,
        reorderLevel: 8,
        unitCost: 80,
      },
    });
  }

  const family = await prisma.family.create({
    data: { familyId: 'FAM-0001', name: 'Sharma Family' },
  });

  const year = new Date().getFullYear();
  const patientsData = [
    { uhid: `HC-${year}-0001`, fullName: 'Rajesh Kumar', ageYears: 42, gender: 'Male', phone: '9811111111', city: 'Delhi', address: '12 Green Park', familyId: family.id },
    { uhid: `HC-${year}-0002`, fullName: 'Sunita Kumar', ageYears: 38, gender: 'Female', phone: '9811111112', city: 'Delhi', address: '12 Green Park', familyId: family.id },
    { uhid: `HC-${year}-0003`, fullName: 'Aarav Mehta', ageYears: 8, gender: 'Male', phone: '9822222222', city: 'Noida', address: 'Sector 62' },
    { uhid: `HC-${year}-0004`, fullName: 'Meera Iyer', ageYears: 55, gender: 'Female', phone: '9833333333', city: 'Gurgaon', address: 'DLF Phase 2' },
    { uhid: `HC-${year}-0005`, fullName: 'Vikram Singh', ageYears: 29, gender: 'Male', phone: '9844444444', city: 'Delhi', address: 'Rohini Sector 9' },
    { uhid: `HC-${year}-0006`, fullName: 'Priya Nair', ageYears: 34, gender: 'Female', phone: '9855555555', city: 'Delhi', address: 'Saket' },
    { uhid: `HC-${year}-0007`, fullName: 'Rohan Gupta', ageYears: 12, gender: 'Male', phone: '9866666666', city: 'Noida', address: 'Sector 18' },
    { uhid: `HC-${year}-0008`, fullName: 'Anita Desai', ageYears: 47, gender: 'Female', phone: '9877777777', city: 'Delhi', address: 'Lajpat Nagar' },
    { uhid: `HC-${year}-0009`, fullName: 'Karan Malhotra', ageYears: 31, gender: 'Male', phone: '9888888888', city: 'Gurgaon', address: 'Sohna Road' },
    { uhid: `HC-${year}-0010`, fullName: 'Deepa Sharma', ageYears: 26, gender: 'Female', phone: '9899999999', city: 'Delhi', address: 'Dwarka' },
    { uhid: `HC-${year}-0011`, fullName: 'Ishaan Patel', ageYears: 6, gender: 'Male', phone: '9800000001', city: 'Noida', address: 'Sector 50' },
    { uhid: `HC-${year}-0012`, fullName: 'Neha Kapoor', ageYears: 41, gender: 'Female', phone: '9800000002', city: 'Delhi', address: 'Pitampura' },
    { uhid: `HC-${year}-0013`, fullName: 'Arjun Reddy', ageYears: 52, gender: 'Male', phone: '9800000003', city: 'Gurgaon', address: 'MG Road' },
    { uhid: `HC-${year}-0014`, fullName: 'Pooja Verma', ageYears: 33, gender: 'Female', phone: '9800000004', city: 'Delhi', address: 'Karol Bagh' },
    { uhid: `HC-${year}-0015`, fullName: 'Sanjay Joshi', ageYears: 60, gender: 'Male', phone: '9800000005', city: 'Delhi', address: 'R K Puram' },
  ];

  const patients = [];
  for (const p of patientsData) {
    patients.push(await prisma.patient.create({ data: { clinicId: clinic.id, ...p } }));
  }

  const case1 = await prisma.caseRecord.create({
    data: {
      patientId: patients[0].id,
      authorId: doctor.id,
      visitType: 'NEW',
      version: 1,
      isLocked: true,
      chiefComplaints: JSON.stringify([
        {
          description: 'Chronic migraine',
          location: 'Right temple',
          sensation: 'Throbbing',
          modalityAgg: ['Noise', 'Sun', 'Afternoon'],
          modalityAmel: ['Pressure', 'Dark room', 'Sleep'],
          duration: '3 years',
          concomitants: 'Nausea',
        },
      ]),
      physicalGenerals: JSON.stringify({
        appetite: 'Good',
        thirst: 'Thirsty for cold water',
        sleep: 'Disturbed by pain',
        dreams: 'None notable',
        stool: 'Regular',
        urine: 'Normal',
        perspiration: 'Scanty',
        thermal: 'Chilly',
        cravings: ['Salt', 'Sweets'],
        aversions: ['Milk'],
      }),
      mentalGenerals: JSON.stringify({
        temperament: 'Reserved',
        fears: ['Failure'],
        anger: 'Suppressed',
        consolation: 'Worse from consolation',
        memory: 'Good',
        mood: 'Anxious about health',
      }),
      pastHistory: JSON.stringify({
        illnesses: ['Typhoid 2015'],
        surgeries: [],
        allergies: ['Dust'],
        familyHistory: ['Diabetes (father)', 'Migraine (mother)'],
      }),
      physicalExam: JSON.stringify({ bp: '128/82', weight: '72', pulse: '78' }),
      provisionalDiagnosis: 'Migraine / Chronic headache',
      miasm: 'Psoric',
      doctorObservation: 'Lean build, anxious about work deadlines. Prefers alone during headache.',
    },
  });

  await prisma.caseRecord.create({
    data: {
      patientId: patients[0].id,
      authorId: doctor.id,
      visitType: 'FOLLOW_UP',
      version: 1,
      isLocked: true,
      visitDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      chiefComplaints: JSON.stringify([
        { description: 'Migraine — intensity reduced', location: 'Right temple', sensation: 'Dull ache', duration: 'follow-up' },
      ]),
      provisionalDiagnosis: 'Migraine — improving',
      miasm: 'Psoric',
      improvementStatus: 'Improved',
      improvementPercent: 60,
      doctorObservation: 'Frequency reduced from 3/week to 1/week. Sleep better.',
    },
  });

  await prisma.followUp.create({
    data: {
      patientId: patients[0].id,
      caseRecordId: case1.id,
      improvementStatus: 'Improved',
      improvementPercent: 60,
      symptomsReported: 'Less frequent headaches',
      nextVisitDue: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
  });

  const natMur = remedies.find((r) => r.name.includes('Natrum Muriaticum'));
  const sulphur = remedies.find((r) => r.name.includes('Sulphur'));
  const pulsatilla = remedies.find((r) => r.name.includes('Pulsatilla'));
  const rxTemplates = [
    { remedy: natMur, potency: '200C' },
    { remedy: sulphur, potency: '30C' },
    { remedy: pulsatilla, potency: '200C' },
    { remedy: remedies.find((r) => r.name.includes('Arsenicum')), potency: '30C' },
    { remedy: remedies.find((r) => r.name.includes('Lycopodium')), potency: '200C' },
  ];

  let rxNo = 1;
  for (let i = 0; i < patients.length; i += 1) {
    const count = 2 + (i % 3);
    for (let j = 0; j < count; j += 1) {
      const tpl = rxTemplates[(i + j) % rxTemplates.length];
      const visitDate = new Date(Date.now() - (j * 45 + i * 7) * 24 * 60 * 60 * 1000);
      await prisma.prescription.create({
        data: {
          patientId: patients[i].id,
          authorId: doctor.id,
          prescriptionNo: `RX-${year}-${String(rxNo).padStart(4, '0')}`,
          visitDate,
          specialInstructions: 'Avoid coffee and mint. Take 30 mins before food.',
          nextVisitDays: 15,
          items: {
            create: [
              {
                remedyId: tpl.remedy?.id,
                remedyName: tpl.remedy?.name || 'Natrum Muriaticum',
                potency: tpl.potency,
                dosage: '4 pills',
                frequency: j % 2 === 0 ? 'Once daily' : 'Twice daily',
                duration: '7 days',
                instructions: 'Morning, empty stomach',
              },
            ],
          },
        },
      });
      rxNo += 1;
    }
  }

  const reportPatients = [patients[0], patients[3], patients[4], patients[6], patients[9], patients[11]];
  const reportTags = [
    ['Skin — before treatment', 'Skin — after 3 months'],
    ['Thyroid report — Jan 2025', 'Thyroid report — Jul 2025'],
    ['Blood test — baseline', 'Blood test — follow-up'],
    ['X-ray — knee', 'X-ray — knee (3 months later)'],
    ['Old prescription scan'],
    ['ECG report'],
  ];
  for (let i = 0; i < reportPatients.length; i += 1) {
    const tags = reportTags[i];
    for (let j = 0; j < tags.length; j += 1) {
      await prisma.attachment.create({
        data: {
          patientId: reportPatients[i].id,
          fileName: `report-${i}-${j}.jpg`,
          fileUrl: `https://picsum.photos/seed/clinic${i}${j}/800/600`,
          fileType: 'image/jpeg',
          category: 'REPORT',
          tag: tags[j],
          uploadedAt: new Date(Date.now() - (tags.length - j) * 90 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  const today = new Date();
  today.setHours(10, 0, 0, 0);

  for (let i = 0; i < 8; i += 1) {
    const d = new Date(today);
    d.setHours(10 + i, 0, 0, 0);
    await prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        patientId: patients[i].id,
        createdById: doctor.id,
        date: d,
        timeSlot: `${10 + i}:00`,
        tokenNumber: i + 1,
        type: i < 3 ? 'FOLLOW_UP' : 'NEW',
        status: i === 0 ? 'ARRIVED' : i === 1 ? 'IN_CONSULTATION' : 'SCHEDULED',
      },
    });
  }

  let invNo = 1;
  for (let i = 0; i < 10; i += 1) {
    const fee = i % 3 === 0 ? 600 : 400;
    const paid = i % 4 !== 0;
    await prisma.invoice.create({
      data: {
        clinicId: clinic.id,
        patientId: patients[i].id,
        invoiceNo: `INV-${year}-${String(invNo).padStart(4, '0')}`,
        consultationFee: fee,
        medicineCharge: i % 2 === 0 ? 150 : 0,
        totalAmount: fee + (i % 2 === 0 ? 150 : 0),
        paidAmount: paid ? fee + (i % 2 === 0 ? 150 : 0) : 0,
        paymentMode: paid ? (i % 2 === 0 ? 'UPI' : 'CASH') : 'PENDING',
        status: paid ? 'PAID' : 'PENDING',
        visitDate: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000),
      },
    });
    invNo += 1;
  }

  console.log('✅ Seed complete!\n');
  console.log('Login credentials (password for all: password123):');
  console.log('  Doctor:       9876543210');
  console.log('  Receptionist: 9876543211');
  console.log('  Assistant:    9876543212');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
