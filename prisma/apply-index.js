const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_doctor_active_slot 
    ON Appointment (doctorId, date, time) 
    WHERE status != 'CANCELLED';
  `);
  console.log('Partial unique index applied successfully!');
}

main()
  .catch((err) => {
    console.error('Error applying index:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
