const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteEducationLeads() {
  try {
    // Find education industry
    const industry = await prisma.industry.findUnique({
      where: { name: 'education' },
    });

    if (!industry) {
      console.log('Education industry not found');
      return;
    }

    console.log(`Found education industry with ID: ${industry.id}`);

    // Find companies with education industry
    const companies = await prisma.company.findMany({
      where: {
        industryIds: {
          has: industry.id,
        },
      },
    });

    console.log(`Found ${companies.length} companies with education industry`);

    if (companies.length === 0) {
      console.log('No companies to delete');
      return;
    }

    // Delete companies
    const deleted = await prisma.company.deleteMany({
      where: {
        industryIds: {
          has: industry.id,
        },
      },
    });

    console.log(`Deleted ${deleted.count} companies with education industry`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

deleteEducationLeads();
