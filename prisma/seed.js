const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function main() {
  console.log('Seeding Mediwell database...');

  // Clean existing data
  await prisma.appointment.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('demo1234', 10);

  // 1. Create Core Users
  const patient = await prisma.user.create({
    data: {
      name: 'Aarav Mehta',
      email: 'patient@mediwell.demo',
      passwordHash,
      role: 'PATIENT',
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Mediwell Admin',
      email: 'admin@mediwell.demo',
      passwordHash,
      role: 'ADMIN',
    },
  });

  // Doctor User 1 (Demo Doctor)
  const doctorUser1 = await prisma.user.create({
    data: {
      name: 'Dr. Ananya Sharma',
      email: 'doctor@mediwell.demo',
      passwordHash,
      role: 'DOCTOR',
    },
  });

  // Doctor User 2
  const doctorUser2 = await prisma.user.create({
    data: {
      name: 'Dr. Rajesh Kulkarni',
      email: 'dr.rajesh@mediwell.demo',
      passwordHash,
      role: 'DOCTOR',
    },
  });

  // Doctor User 3
  const doctorUser3 = await prisma.user.create({
    data: {
      name: 'Dr. Priya Nair',
      email: 'dr.priya@mediwell.demo',
      passwordHash,
      role: 'DOCTOR',
    },
  });

  // Doctor User 4
  const doctorUser4 = await prisma.user.create({
    data: {
      name: 'Dr. Vikram Sethi',
      email: 'dr.vikram@mediwell.demo',
      passwordHash,
      role: 'DOCTOR',
    },
  });

  // Doctor User 5
  const doctorUser5 = await prisma.user.create({
    data: {
      name: 'Dr. Sunita Mehra',
      email: 'dr.sunita@mediwell.demo',
      passwordHash,
      role: 'DOCTOR',
    },
  });

  // Doctor User 6 (Inactive Doctor)
  const doctorUser6 = await prisma.user.create({
    data: {
      name: 'Dr. Rohan Verma',
      email: 'dr.rohan@mediwell.demo',
      passwordHash,
      role: 'DOCTOR',
    },
  });

  // Second demo patient for realistic doctor views
  const patient2 = await prisma.user.create({
    data: {
      name: 'Neha Kapoor',
      email: 'neha.kapoor@example.com',
      passwordHash,
      role: 'PATIENT',
    },
  });

  // 2. Create Doctors
  const doc1 = await prisma.doctor.create({
    data: {
      userId: doctorUser1.id,
      name: 'Dr. Ananya Sharma',
      specialty: 'Cardiology',
      hospital: 'Apollo Multispeciality Hospital',
      fee: 800,
      yearsExperience: 12,
      active: true,
    },
  });

  const doc2 = await prisma.doctor.create({
    data: {
      userId: doctorUser2.id,
      name: 'Dr. Rajesh Kulkarni',
      specialty: 'Orthopedics',
      hospital: 'Fortis Memorial Hospital',
      fee: 950,
      yearsExperience: 15,
      active: true,
    },
  });

  const doc3 = await prisma.doctor.create({
    data: {
      userId: doctorUser3.id,
      name: 'Dr. Priya Nair',
      specialty: 'Pediatrics',
      hospital: "Rainbow Children's Clinic",
      fee: 600,
      yearsExperience: 9,
      active: true,
    },
  });

  const doc4 = await prisma.doctor.create({
    data: {
      userId: doctorUser4.id,
      name: 'Dr. Vikram Sethi',
      specialty: 'Dermatology',
      hospital: 'Skin & Laser Care Institute',
      fee: 750,
      yearsExperience: 11,
      active: true,
    },
  });

  const doc5 = await prisma.doctor.create({
    data: {
      userId: doctorUser5.id,
      name: 'Dr. Sunita Mehra',
      specialty: 'General medicine',
      hospital: 'Max Super Speciality Hospital',
      fee: 500,
      yearsExperience: 14,
      active: true,
    },
  });

  // Inactive doctor
  const doc6 = await prisma.doctor.create({
    data: {
      userId: doctorUser6.id,
      name: 'Dr. Rohan Verma',
      specialty: 'Cardiology',
      hospital: 'Medanta Heart Institute',
      fee: 1200,
      yearsExperience: 18,
      active: false,
    },
  });

  // 3. Create Appointments (spread over today and next 3 days)
  const now = new Date();
  const day0 = formatDate(now);
  const day1 = formatDate(new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000));
  const day2 = formatDate(new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000));
  const day3 = formatDate(new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000));

  const appointmentsData = [
    // Today
    {
      doctorId: doc1.id,
      patientId: patient.id,
      date: day0,
      time: '09:30',
      reason: 'Routine cardiac checkup and blood pressure review',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: 'UPI',
      paymentAmount: doc1.fee,
      transactionId: 'TXN_UPI_89431278',
    },
    {
      doctorId: doc2.id,
      patientId: patient2.id,
      date: day0,
      time: '14:00',
      reason: 'Persistent knee ache after marathon training',
      status: 'PENDING',
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
      paymentAmount: doc2.fee,
      transactionId: 'TXN_CRD_49201582',
    },
    {
      doctorId: doc1.id,
      patientId: patient2.id,
      date: day0,
      time: '11:00',
      reason: 'Second opinion on ECG report',
      status: 'PENDING',
      paymentStatus: 'PAY_AT_CLINIC',
      paymentMethod: 'PAY_AT_CLINIC',
      paymentAmount: doc1.fee,
      transactionId: null,
    },

    // Tomorrow (Day 1)
    {
      doctorId: doc3.id,
      patientId: patient.id,
      date: day1,
      time: '10:00',
      reason: 'Seasonal allergy follow-up and vaccination',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: 'UPI',
      paymentAmount: doc3.fee,
      transactionId: 'TXN_UPI_77192340',
    },
    {
      doctorId: doc4.id,
      patientId: patient.id,
      date: day1,
      time: '15:30',
      reason: 'Mild eczema flare-up and skin barrier consultation',
      status: 'PENDING',
      paymentStatus: 'PAID',
      paymentMethod: 'NETBANKING',
      paymentAmount: doc4.fee,
      transactionId: 'TXN_NB_31298410',
    },

    // Day 2
    {
      doctorId: doc5.id,
      patientId: patient2.id,
      date: day2,
      time: '09:00',
      reason: 'Annual master health blood test review',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      paymentMethod: 'UPI',
      paymentAmount: doc5.fee,
      transactionId: 'TXN_UPI_66103492',
    },
    {
      doctorId: doc1.id,
      patientId: patient.id,
      date: day2,
      time: '10:30',
      reason: 'Appointment cancelled due to patient travel',
      status: 'CANCELLED',
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
      paymentAmount: doc1.fee,
      transactionId: 'TXN_CRD_11093485',
    },

    // Day 3
    {
      doctorId: doc2.id,
      patientId: patient.id,
      date: day3,
      time: '16:00',
      reason: 'Post-cast physical therapy evaluation',
      status: 'CONFIRMED',
      paymentStatus: 'PAY_AT_CLINIC',
      paymentMethod: 'PAY_AT_CLINIC',
      paymentAmount: doc2.fee,
      transactionId: null,
    },
  ];

  for (const appt of appointmentsData) {
    await prisma.appointment.create({ data: appt });
  }

  // Ensure partial unique index exists
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_doctor_active_slot 
    ON Appointment (doctorId, date, time) 
    WHERE status != 'CANCELLED';
  `);

  console.log('Mediwell seed completed successfully:');
  console.log(`- 3 Demo Roles: Patient (${patient.email}), Doctor (${doctorUser1.email}), Admin (${admin.email})`);
  console.log(`- Password for all: demo1234`);
  console.log(`- 6 Doctors created (5 Active, 1 Inactive)`);
  console.log(`- ${appointmentsData.length} Appointments seeded across Day 0 to Day 3 with mixed statuses`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
