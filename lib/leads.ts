import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b(llc|inc|pllc|pc|dds|pa|psc)\b/gi, '')
    .trim()
}

function normalizeDomain(domain?: string): string {
  if (!domain) return ''
  return domain.toLowerCase().trim()
}

function normalizeAddress(address?: string): string {
  if (!address) return ''
  return address
    .toLowerCase()
    .replace(/\b(st|street|ave|avenue|rd|road|blvd|boulevard|ln|lane|dr|drive|ct|court|pk|park|pl|place)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function createDedupKey(
  name: string,
  domain?: string,
  address?: string
): string {
  const normalized = normalizeCompanyName(name)
  const domainPart = normalizeDomain(domain)
  const addressPart = normalizeAddress(address)
  return `${normalized}|${domainPart}|${addressPart}`
}

interface UpsertProspectInput {
  name: string
  nameNormalized?: string
  website?: string
  domain?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  territory?: string
  industry?: string
  segment?: string
  tier?: string
  estMonthlyValue?: number
  sqftEstimate?: number
  locationsCount?: number
  whyTheyFit?: string
  source: string
}

export async function upsertProspect(data: UpsertProspectInput) {
  const nameNormalized = data.nameNormalized || normalizeCompanyName(data.name)
  const dedupKey = createDedupKey(data.name, data.domain, data.address)

  try {
    // Try to create — if dedupKey exists, this will fail with unique constraint
    const company = await prisma.company.create({
      data: {
        name: data.name,
        nameNormalized,
        website: data.website,
        domain: data.domain ? normalizeDomain(data.domain) : undefined,
        address: data.address,
        city: data.city,
        state: data.state || 'OK',
        zip: data.zip,
        territory: (data.territory as any) || 'OTHER',
        industry: data.industry,
        segment: (data.segment as any) || 'BASE_HIT',
        tier: (data.tier as any) || 'UNSCORED',
        estMonthlyValue: data.estMonthlyValue,
        sqftEstimate: data.sqftEstimate,
        locationsCount: data.locationsCount || 1,
        whyTheyFit: data.whyTheyFit,
        dedupKey,
        source: data.source,
      },
    })

    return { company, duplicate: false, candidates: [] }
  } catch (err: any) {
    // Unique constraint violation — it's a duplicate
    if (err.code === 'P2002') {
      const existing = await prisma.company.findUnique({
        where: { dedupKey },
      })
      if (existing) {
        return { company: existing, duplicate: 'exact', candidates: [existing] }
      }
    }
    throw err
  }
}

export async function createDraft(
  companyId: string,
  contactId: string,
  data: {
    personalization: string
    emailBody: string
    subjectLine?: string
    campaignId?: string
  }
) {
  return prisma.draft.create({
    data: {
      companyId,
      contactId,
      personalization: data.personalization,
      emailBody: data.emailBody,
      subjectLine: data.subjectLine,
      campaignId: data.campaignId,
      status: 'PENDING',
    },
    include: {
      company: true,
      contact: true,
    },
  })
}

export async function logInteraction(
  companyId: string,
  contactId: string | undefined,
  data: {
    date: Date
    channel: string
    summary: string
    painPoints?: string
    contractTiming?: string
    referralsDiscussed?: string
    nextSteps?: string
    followUpDate?: Date
  }
) {
  return prisma.interaction.create({
    data: {
      companyId,
      contactId: contactId || undefined,
      date: data.date,
      channel: data.channel as any,
      summary: data.summary,
      painPoints: data.painPoints,
      contractTiming: data.contractTiming,
      referralsDiscussed: data.referralsDiscussed,
      nextSteps: data.nextSteps,
      followUpDate: data.followUpDate,
    },
  })
}
