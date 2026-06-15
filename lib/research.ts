import { prisma } from './prisma'

export const INDUSTRIES = {
  dental: { name: 'Dental Offices', searchTerm: 'dental offices', count: 120 },
  medical: { name: 'Medical Offices', searchTerm: 'medical offices', count: 95 },
  church: { name: 'Churches', searchTerm: 'churches', count: 145 },
  industrial: { name: 'Industrial Offices', searchTerm: 'industrial office', count: 85, whale: true },
  accounting: { name: 'Accounting Firms', searchTerm: 'accounting firms', count: 70 },
  law: { name: 'Law Offices', searchTerm: 'law offices', count: 65 },
  financial: { name: 'Financial Services', searchTerm: 'financial advisor', count: 80 },
  retreat: { name: 'Retreat Centers & Venues', searchTerm: 'retreat center', count: 25, whale: true },
  education: { name: 'Educational Facilities', searchTerm: 'schools offices', count: 55, whale: true },
}

interface ProspectData {
  name: string
  address?: string
  city?: string
  phone?: string
  website?: string
  businessType: string
}

export async function importProspectsForIndustry(
  industryKey: string,
  prospects: ProspectData[]
) {
  const industry = INDUSTRIES[industryKey as keyof typeof INDUSTRIES]
  if (!industry) throw new Error(`Unknown industry: ${industryKey}`)

  // Get or create industry record
  let industryRecord = await prisma.industry.findUnique({
    where: { name: industry.name },
  })

  if (!industryRecord) {
    industryRecord = await prisma.industry.create({
      data: { name: industry.name },
    })
  }

  let imported = 0
  let duplicates = 0
  let errors = 0

  for (const prospect of prospects) {
    try {
      // Import via upsertProspect
      const { upsertProspect } = await import('./leads')
      const result = await upsertProspect({
        name: prospect.name,
        address: prospect.address,
        city: prospect.city || 'Tulsa',
        state: 'OK',
        website: prospect.website,
        source: `research_${industryKey}`,
      })

      if (!result.duplicate) {
        imported++

        // Tag company with industry
        await prisma.company.update({
          where: { id: result.company.id },
          data: {
            industryIds: [industryRecord.id],
          },
        })

        // Add contact with phone if available
        if (prospect.phone) {
          await prisma.contact.upsert({
            where: {
              companyId_email: {
                companyId: result.company.id,
                email: `research-${Date.now()}@placeholder.local`, // Placeholder
              },
            },
            create: {
              companyId: result.company.id,
              email: null,
              phone: prospect.phone,
              contactType: 'GENERAL_OFFICE',
              isPrimary: true,
            },
            update: {},
          })
        }
      } else {
        duplicates++
      }
    } catch (err) {
      errors++
      console.error(`Error importing ${prospect.name}:`, err)
    }
  }

  return { imported, duplicates, errors }
}

export async function getProspectsForIndustry(industryKey: string) {
  const where: any = {
    source: `research_${industryKey}`,
  }

  return await prisma.company.findMany({
    where,
    include: { contacts: true, interactions: { take: 1 } },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getIndustryStats(industryKey: string) {
  const prospects = await getProspectsForIndustry(industryKey)

  const contacted = prospects.filter((p) =>
    ['CONTACTED', 'REPLIED', 'PROPOSAL_SENT', 'WON'].includes(p.stage)
  ).length

  const remaining = prospects.length - contacted

  return {
    total: prospects.length,
    contacted,
    remaining,
    percentComplete: prospects.length > 0 ? Math.round((contacted / prospects.length) * 100) : 0,
  }
}

export async function getDailyProspects(industryKey: string, count: number = 25) {
  const prospects = await getProspectsForIndustry(industryKey)

  // Filter to those not yet contacted
  const uncontacted = prospects.filter((p) =>
    ['NEW', 'RESEARCHED'].includes(p.stage)
  )

  // Sort by priority (whales first, then by created date)
  uncontacted.sort((a, b) => {
    if (a.segment === 'WHALE' && b.segment !== 'WHALE') return -1
    if (a.segment !== 'WHALE' && b.segment === 'WHALE') return 1
    return a.createdAt.getTime() - b.createdAt.getTime()
  })

  return uncontacted.slice(0, count)
}

export async function getIndustryDepletionWarning(industryKey: string) {
  const stats = await getIndustryStats(industryKey)

  if (stats.total === 0) {
    return null
  }

  const percentComplete = stats.percentComplete
  const threshold = 85

  if (percentComplete >= threshold) {
    return {
      warning: true,
      message: `You're ${percentComplete}% through ${INDUSTRIES[industryKey as keyof typeof INDUSTRIES].name}. Ready to switch industries?`,
      remaining: stats.remaining,
    }
  }

  return {
    warning: false,
    message: `${stats.remaining} ${INDUSTRIES[industryKey as keyof typeof INDUSTRIES].name} left to contact`,
    remaining: stats.remaining,
  }
}

export async function autoDetectWhales(industryKey: string) {
  const prospects = await getProspectsForIndustry(industryKey)
  const industry = INDUSTRIES[industryKey as keyof typeof INDUSTRIES]

  // Flag as whales if:
  // 1. Industry is marked as whale type (retreat, education, industrial)
  // 2. Multi-location facilities
  // 3. Large organizations

  const whales = prospects.filter((p) => {
    if (industry.whale) return true
    if (p.locationsCount && p.locationsCount > 1) return true
    if (p.sqftEstimate && p.sqftEstimate > 10000) return true
    return false
  })

  // Update their segment
  for (const whale of whales) {
    if (whale.segment !== 'WHALE') {
      await prisma.company.update({
        where: { id: whale.id },
        data: { segment: 'WHALE' },
      })
    }
  }

  return whales
}

export async function getCurrentIndustryFocus(): Promise<string | null> {
  // Get the most recently researched industry that still has prospects
  const recent = await prisma.company.findFirst({
    where: {
      source: {
        startsWith: 'research_',
      },
      stage: { in: ['NEW', 'RESEARCHED'] },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!recent || !recent.source) return null

  const industryKey = recent.source.replace('research_', '')
  return industryKey
}
