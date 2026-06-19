const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkIndustries() {
  try {
    const industries = await prisma.industry.findMany();
    console.log('Industries in database:');
    industries.forEach(i => console.log(`  - ${i.name} (${i.id})`));
  } finally {
    await prisma.$disconnect();
  }
}

checkIndustries();
