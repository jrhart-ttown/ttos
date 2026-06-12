import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import PipelineTable from '@/components/PipelineTable'
import PipelineFilters from '@/components/PipelineFilters'

interface SearchParams {
  stage?: string
  tier?: string
  territory?: string
  segment?: string
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
        <h1 className="text-3xl font-bold mb-4">Pipeline</h1>

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
      </div>

      <div className="overflow-x-auto">
        <PipelineTable companies={companies} />
      </div>
    </div>
  )
}
