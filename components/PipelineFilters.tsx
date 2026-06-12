'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const STAGES = ['NEW', 'RESEARCHED', 'QUEUED', 'CONTACTED', 'REPLIED', 'WALKTHROUGH_SCHEDULED', 'PROPOSAL_SENT', 'WON', 'LOST', 'NURTURE']
const TIERS = ['A', 'B', 'C', 'UNSCORED']
const TERRITORIES = ['SOUTH_TULSA', 'JENKS', 'BROKEN_ARROW', 'BIXBY', 'MIDTOWN_TULSA', 'OWASSO', 'SAND_SPRINGS', 'SAPULPA', 'OTHER']
const SEGMENTS = ['BASE_HIT', 'WHALE']

export default function PipelineFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const stage = searchParams.get('stage') || ''
  const tier = searchParams.get('tier') || ''
  const territory = searchParams.get('territory') || ''
  const segment = searchParams.get('segment') || ''

  const handleFilterChange = (
    filterName: string,
    value: string
  ) => {
    const params = new URLSearchParams(searchParams)

    if (value) {
      params.set(filterName, value)
    } else {
      params.delete(filterName)
    }

    router.push(`/pipeline?${params.toString()}`)
  }

  const handleReset = () => {
    router.push('/pipeline')
  }

  return (
    <div className="flex flex-wrap gap-4 items-center p-4 bg-white border border-gray-200 rounded">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Stage:</label>
        <select
          value={stage}
          onChange={(e) => handleFilterChange('stage', e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded"
        >
          <option value="">All</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Tier:</label>
        <select
          value={tier}
          onChange={(e) => handleFilterChange('tier', e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded"
        >
          <option value="">All</option>
          {TIERS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Territory:</label>
        <select
          value={territory}
          onChange={(e) => handleFilterChange('territory', e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded"
        >
          <option value="">All</option>
          {TERRITORIES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Segment:</label>
        <select
          value={segment}
          onChange={(e) => handleFilterChange('segment', e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded"
        >
          <option value="">All</option>
          {SEGMENTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {(stage || tier || territory || segment) && (
        <button
          onClick={handleReset}
          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Reset
        </button>
      )}
    </div>
  )
}
