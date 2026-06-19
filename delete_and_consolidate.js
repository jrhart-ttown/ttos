const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    // 1. Delete Educational Facilities leads
    const educationIndustry = await prisma.industry.findUnique({
      where: { name: 'Educational Facilities' },
    });

    if (educationIndustry) {
      const deletedCount = await prisma.company.deleteMany({
        where: {
          industryIds: { has: educationIndustry.id },
        },
      });
      console.log(`✓ Deleted ${deletedCount.count} educational facilities leads`);
    }

    // 2. Move Dental Offices companies to Dental industry
    const dentalOfficesIndustry = await prisma.industry.findUnique({
      where: { name: 'Dental Offices' },
    });
    const dentalIndustry = await prisma.industry.findUnique({
      where: { name: 'Dental' },
    });

    if (dentalOfficesIndustry && dentalIndustry) {
      const companies = await prisma.company.findMany({
        where: {
          industryIds: { has: dentalOfficesIndustry.id },
        },
      });

      for (const company of companies) {
        const newIds = company.industryIds
          .filter(id => id !== dentalOfficesIndustry.id)
          .concat(dentalIndustry.id);
        
        await prisma.company.update({
          where: { id: company.id },
          data: { industryIds: newIds },
        });
      }
      console.log(`✓ Updated ${companies.length} companies from Dental Offices to Dental`);
    }

    // 3. Delete Dentist and Dental Offices industries
    const dentistIndustry = await prisma.industry.findUnique({
      where: { name: 'Dentist' },
    });
    if (dentistIndustry) {
      await prisma.industry.delete({ where: { id: dentistIndustry.id } });
      console.log(`✓ Deleted Dentist industry`);
    }

    if (dentalOfficesIndustry) {
      await prisma.industry.delete({ where: { id: dentalOfficesIndustry.id } });
      console.log(`✓ Deleted Dental Offices industry`);
    }

    console.log('\n✓ All consolidation complete');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
