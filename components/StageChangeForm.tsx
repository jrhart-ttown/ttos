'use client'

import { useState } from 'react'

const STAGES = [
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
]

export default function StageChangeForm({
  companyId,
  currentStage,
}: {
  companyId: string
  currentStage: string
}) {
  const [loading, setLoading] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStage = e.target.value
    if (newStage === currentStage) return

    setLoading(true)

    try {
      const res = await fetch(`/api/companies/${companyId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })

      if (!res.ok) {
        throw new Error('Failed to update stage')
      }

      // Reload page to reflect changes
      window.location.reload()
    } catch (err) {
      alert('Error updating stage: ' + (err as Error).message)
      setLoading(false)
    }
  }

  return (
    <select
      value={currentStage}
      onChange={handleChange}
      disabled={loading}
      className="px-2 py-1 text-sm border border-gray-300 rounded"
    >
      {STAGES.map((stage) => (
        <option key={stage} value={stage}>
          {stage}
        </option>
      ))}
    </select>
  )
}
