'use client'

import { useState } from 'react'
import IndustrySelector from './IndustrySelector'

export default function IndustriesSection({
  companyId,
  initialIndustryIds,
}: {
  companyId: string
  initialIndustryIds: string[]
}) {
  const [updating, setUpdating] = useState(false)

  const handleUpdate = async (industryIds: string[]) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/companies/${companyId}/industries`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industryIds }),
      })

      if (!res.ok) {
        throw new Error('Failed to update industries')
      }
    } catch (err) {
      alert('Error: ' + (err as Error).message)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-bold mb-4">Industries</h2>
      {updating && <p className="text-sm text-gray-600 mb-4">Saving...</p>}
      <IndustrySelector
        companyId={companyId}
        selectedIds={initialIndustryIds}
        onUpdate={handleUpdate}
      />
    </div>
  )
}
