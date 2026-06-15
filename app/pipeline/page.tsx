import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import PipelineTable from '@/components/PipelineTable'
import PipelineFilters from '@/components/PipelineFilters'
import PipelineSummaryCards from '@/components/PipelineSummaryCards'
import CSVUpload from '@/components/CSVUpload'

interface SearchParams {
  stage?: string
  tier?: string
  territory?: string
  segment?: string
  industry?: string
  quickfilter?: string
}

export const metadata = {
  title: 'Pipeline | TTOS',
}

function getPriorityScore(company: any): number {
  const now = new Date()

  // Overdue next actions — highest priority
  if (company.nextActionDate && company.nextActionDate < now) {
    return 0
  }

  // Due today
  if (company.nextActionDate && company.nextActionDate.toDateString() === now.toDateString()) {
    return 1
  }

  // Replied or engaged
  if (company.stage === 'REPLIED' || company.stage === 'WALKTHROUGH_SCHEDULED') {
    return 2
  }

  // Proposal follow-ups
  if (company.stage === 'PROPOSAL_SENT') {
    return 3
  }

  // A-tier and Whales
  if (company.tier === 'A' || company.segment === 'WHALE') {
    return 4
  }

  // B-tier
  if (company.tier === 'B') {
    return 5
  }

  // Ready to contact (contacted but no reply)
  if (company.stage === 'CONTACTED') {
    return 6
  }

  // New leads
  if (company.stage === 'NEW' || company.stage === 'RESEARCHED') {
    return 7
  }

  // Nurture and Lost at bottom
  if (company.stage === 'NURTURE' || company.stage === 'LOST') {
    return 10
  }

  return 8
}

export default async function PipelinePageAsync({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const where: any = {}

  if (searchParams.stage) where.stage = searchParams.stage
  if (searchParams.tier) where.tier = searchParams.tier
  if (searchParams.territory) where.territory = searchParams.territory
  if (searchParams.segment) where.segment = searchParams.segment
  if (searchParams.industry) {
    where.industryIds = {
      has: searchParams.industry,
    }
  }

  // Apply quick filters if set
  if (searchParams.quickfilter) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    switch (searchParams.quickfilter) {
      case 'overdue':
        where.nextActionDate = { lt: today }
        where.stage = { notIn: ['WON', 'LOST', 'NURTURE'] }
        break
      case 'today':
        where.nextActionDate = { gte: today, lt: tomorrow }
        break
      case 'no-next-action':
        where.nextActionDate = null
        where.stage = { notIn: ['WON', 'LOST', 'NURTURE'] }
        break
      case 'no-contact':
        where.contacts = { none: { email: { not: null } } }
        break
      case 'ready-contact':
        where.stage = 'CONTACTED'
        break
      case 'hot-replies':
        where.stage = { in: ['REPLIED', 'WALKTHROUGH_SCHEDULED'] }
        break
      case 'proposals-out':
        where.stage = 'PROPOSAL_SENT'
        break
      case 'whales':
        where.segment = 'WHALE'
        break
      case 'small-offices':
        where.segment = 'BASE_HIT'
        where.tier = { in: ['B', 'C'] }
        break
      case 'nurture':
        where.stage = 'NURTURE'
        break
    }
  }

  const companies = await prisma.company.findMany({
    where,
    include: {
      contacts: { take: 1, orderBy: { isPrimary: 'desc' } },
      interactions: { take: 1, orderBy: { date: 'desc' } },
      emailLogs: { take: 1, orderBy: { sentDate: 'desc' } },
    },
  })

  // Sort by priority
  companies.sort((a, b) => {
    const scoreA = getPriorityScore(a)
    const scoreB = getPriorityScore(b)
    if (scoreA !== scoreB) return scoreA - scoreB
    // Secondary sort by nextActionDate
    if (a.nextActionDate && b.nextActionDate) {
      return a.nextActionDate.getTime() - b.nextActionDate.getTime()
    }
    return 0
  })

  // Get all-data for summary cards
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const allCompanies = await prisma.company.findMany({
    include: {
      contacts: { take: 1 },
      interactions: { take: 1, orderBy: { date: 'desc' } },
    },
  })

  const stageCounts = await prisma.company.groupBy({
    by: ['stage'],
    _count: true,
  })

  const stageCountMap = stageCounts.reduce(
    (acc, { stage, _count }) => {
      acc[stage] = _count
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="container">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Pipeline</h1>
          <div className="flex gap-4">
            <a
              href="/today"
              className="px-4 py-2 bg-purple-600 text-white rounded font-medium hover:bg-purple-700"
            >
              Today's Work
            </a>
            <a
              href="/settings"
              className="px-4 py-2 bg-gray-600 text-white rounded font-medium hover:bg-gray-700"
            >
              Settings
            </a>
          </div>
        </div>

        <PipelineSummaryCards allCompanies={allCompanies} activeFilter={searchParams.quickfilter} />

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-sm font-semibold mb-3">Quick Filters</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'overdue', label: 'Overdue' },
              { key: 'today', label: 'Due Today' },
              { key: 'hot-replies', label: 'Hot Replies' },
              { key: 'proposals-out', label: 'Proposals Out' },
              { key: 'no-next-action', label: 'No Next Action' },
              { key: 'ready-contact', label: 'Ready to Contact' },
              { key: 'whales', label: 'Whales' },
              { key: 'small-offices', label: 'Small Offices' },
              { key: 'nurture', label: 'Nurture' },
            ].map(({ key, label }) => (
              <Link
                key={key}
                href={`/pipeline?quickfilter=${key}`}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  searchParams.quickfilter === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
              </Link>
            ))}
            {searchParams.quickfilter && (
              <Link
                href="/pipeline"
                className="px-3 py-1 rounded text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Clear
              </Link>
            )}
          </div>
        </div>

        <PipelineFilters />

        <CSVUpload />
      </div>

      <div className="overflow-x-auto">
        <PipelineTable companies={companies} />
      </div>
    </div>
  )
}
