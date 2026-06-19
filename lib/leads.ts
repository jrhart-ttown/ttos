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

function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }
  return dp[m][n]
}

function calculateSimilarity(a: string, b: string): number {
  const normA = normalizeCompanyName(a)
  const normB = normalizeCompanyName(b)
  const maxLen = Math.max(normA.length, normB.length)
  if (maxLen === 0) return 1
  const distance = levenshteinDistance(normA, normB)
  return 1 - distance / maxLen
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
    // Check for fuzzy matches first
    const existingCompanies = await prisma.company.findMany({
      where: { city: data.city || 'Tulsa' },
      select: { id: true, name: true, city: true, address: true },
    })

    const candidates = existingCompanies
      .filter(c => {
        const similarity = calculateSimilarity(data.name, c.name)
        return similarity > 0.75 // Flag if >75% similar
      })
      .sort((a, b) => calculateSimilarity(data.name, b.name) - calculateSimilarity(data.name, a.name))

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

    return { company, duplicate: candidates.length > 0 ? 'potential' : false, candidates }
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
