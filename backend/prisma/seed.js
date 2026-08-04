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
  await prisma.repertorizationSession.deleteMany();
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
  const firstNames = ['Rajesh', 'Sunita', 'Aarav', 'Meera', 'Vikram', 'Priya', 'Rohan', 'Anita', 'Karan', 'Deepa', 'Ishaan', 'Neha', 'Arjun', 'Pooja', 'Sanjay', 'Ritu', 'Amit', 'Kavita', 'Suresh', 'Lata', 'Manoj', 'Geeta', 'Rahul', 'Sneha', 'Vivek', 'Nisha', 'Ashok', 'Rekha', 'Gaurav', 'Anjali'];
  const lastNames = ['Kumar', 'Sharma', 'Mehta', 'Iyer', 'Singh', 'Nair', 'Gupta', 'Desai', 'Malhotra', 'Patel', 'Kapoor', 'Reddy', 'Verma', 'Joshi', 'Agarwal', 'Chopra', 'Bansal', 'Saxena', 'Tiwari', 'Mishra'];
  const cities = ['Delhi', 'Noida', 'Gurgaon', 'Faridabad', 'Ghaziabad'];
  const tags = ['NEW', 'FOLLOW_UP', 'VIP', 'INACTIVE'];
  const genders = ['Male', 'Female'];

  const patientsData = [];
  for (let i = 1; i <= 120; i += 1) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3) % lastNames.length];
    const phone = `98${String(10000000 + i).slice(-8)}`;
    patientsData.push({
      uhid: `HC-${year}-${String(i).padStart(4, '0')}`,
      fullName: `${fn} ${ln}`,
      ageYears: 5 + (i % 65),
      gender: genders[i % 2],
      phone,
      city: cities[i % cities.length],
      address: `Sector ${(i % 80) + 1}, Block ${String.fromCharCode(65 + (i % 5))}`,
      tag: tags[i % 4],
      familyId: i <= 2 ? family.id : null,
    });
  }

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
    const count = 1 + (i % 2);
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
  const reportSets = [
    { tags: ['Skin — Before treatment', 'Skin — After 3 months'], urls: ['https://placehold.co/800x600/f0e4d8/6b4423?text=Skin+Before', 'https://placehold.co/800x600/e4ede6/2f4f37?text=Skin+After+3+Months'] },
    { tags: ['Eczema — Week 1', 'Eczema — Week 8'], urls: ['https://placehold.co/800x600/ffe8d6/c45c26?text=Eczema+Week+1', 'https://placehold.co/800x600/d4e8d4/1e4620?text=Eczema+Week+8'] },
    { tags: ['Thyroid report — Jan 2025', 'Thyroid report — Jul 2025'], urls: ['https://placehold.co/800x600/e8eef5/1e3a5f?text=Thyroid+Baseline', 'https://placehold.co/800x600/e8eef5/1e3a5f?text=Thyroid+Follow-up'] },
    { tags: ['Blood test — baseline', 'Blood test — follow-up'], urls: ['https://placehold.co/800x600/f5f5f4/44403c?text=Blood+Test+Before', 'https://placehold.co/800x600/e7e5e4/292524?text=Blood+Test+After'] },
    { tags: ['Old prescription scan'], urls: ['https://placehold.co/800x600/fff7ed/9a3412?text=Prescription+Scan'] },
    { tags: ['ECG report'], urls: ['https://placehold.co/800x600/fee2e2/991b1b?text=ECG+Report'] },
  ];
  for (let i = 0; i < reportPatients.length; i += 1) {
    const set = reportSets[i];
    for (let j = 0; j < set.tags.length; j += 1) {
      await prisma.attachment.create({
        data: {
          patientId: reportPatients[i].id,
          fileName: `report-${i}-${j}.jpg`,
          fileUrl: set.urls[j],
          fileType: 'image/jpeg',
          category: 'REPORT',
          tag: set.tags[j],
          uploadedAt: new Date(Date.now() - (set.tags.length - j) * 90 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  const today = new Date();
  today.setHours(10, 0, 0, 0);

  for (let i = 0; i < 25; i += 1) {
    const d = new Date(today);
    d.setHours(10 + (i % 12), (i % 2) * 30, 0, 0);
    await prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        patientId: patients[i].id,
        createdById: doctor.id,
        date: d,
        timeSlot: `${10 + (i % 12)}:${i % 2 === 0 ? '00' : '30'}`,
        tokenNumber: i + 1,
        type: i < 8 ? 'FOLLOW_UP' : 'NEW',
        status: i === 0 ? 'ARRIVED' : i === 1 ? 'IN_CONSULTATION' : i < 15 ? 'SCHEDULED' : 'COMPLETED',
      },
    });
  }

  let invNo = 1;
  for (let i = 0; i < 50; i += 1) {
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

  const rubricIds = ['r002', 'r014', 'r051', 'r073', 'r039'];
  for (let i = 0; i < 15; i += 1) {
    await prisma.repertorizationSession.create({
      data: {
        clinicId: clinic.id,
        patientId: patients[i].id,
        authorId: doctor.id,
        title: `Repertorization — ${patients[i].fullName.split(' ')[0]}`,
        rubricIds: JSON.stringify(rubricIds),
        topRemedies: JSON.stringify([
          { name: 'Arsenicum Album', totalScore: 9, rubricCount: 3 },
          { name: 'Gelsemium', totalScore: 7, rubricCount: 2 },
        ]),
        notes: 'Demo session from seed',
      },
    });
  }

  console.log('✅ Seed complete!');
  console.log(`   Patients: ${patients.length}`);
  console.log(`   Prescriptions: ${rxNo - 1}`);
  console.log(`   Invoices: ${invNo - 1}`);
  console.log('   Repertorization sessions: 15\n');
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
