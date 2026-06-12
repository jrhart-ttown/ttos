import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import PipelineTable from '@/components/PipelineTable'
import PipelineFilters from '@/components/PipelineFilters'
import CSVUpload from '@/components/CSVUpload'

interface SearchParams {
  stage?: string
  tier?: string
  territory?: string
  segment?: string
  industry?: string
}

export const metadata = {
  title: 'Pipeline | TTOS',
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

  const companies = await prisma.company.findMany({
    where,
    include: {
      contacts: true,
      interactions: { take: 1, orderBy: { date: 'desc' } },
    },
    orderBy: { nextActionDate: 'asc' },
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
              href="/approval-queue"
              className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700"
            >
              Approval Queue
            </a>
            <a
              href="/settings"
              className="px-4 py-2 bg-gray-600 text-white rounded font-medium hover:bg-gray-700"
            >
              Settings
            </a>
            <a
              href="/audit"
              className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
            >
              Audit Log
            </a>
          </div>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-sm font-semibold mb-3">Stage Summary</h2>
          <div className="flex flex-wrap gap-4">
            {[
              'NEW',
              'RESEARCHED',
              'QUEUED',
              'CONTACTED',
              'REPLIED',
              'WALKTHROUGH_SCHEDULED',
              'PROPOSAL_SENT',
              'WON',
              'LOST',
              'NURTURE',
            ].map((stage) => (
              <div key={stage} className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{stage}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded">
                  {stageCountMap[stage] || 0}
                </span>
              </div>
            ))}
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
