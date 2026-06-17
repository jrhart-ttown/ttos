'use client'

import { useState } from 'react'
import CompanyQuickInfo from './CompanyQuickInfo'

export default function CompanyQuickInfoSidebar({ company }: { company: any }) {
  const [data, setData] = useState(company)

  const handleUpdate = async (updateData: any) => {
    try {
      const res = await fetch(`/api/companies/${company.id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) throw new Error('Failed to update company')

      const updated = await res.json()
      setData(updated)
    } catch (err) {
      alert('Error: ' + (err as Error).message)
    }
  }

  return (
    <div className="sticky top-4">
      <CompanyQuickInfo company={data} onUpdate={handleUpdate} />

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="space-y-4">
          {data.estMonthlyValue && (
            <div>
              <label className="text-xs font-semibold text-gray-600">Est. Monthly Value</label>
              <p className="text-sm font-medium">${data.estMonthlyValue}</p>
            </div>
          )}

          {data.sqftEstimate && (
            <div>
              <label className="text-xs font-semibold text-gray-600">Sq Ft Estimate</label>
              <p className="text-sm font-medium">{data.sqftEstimate.toLocaleString()}</p>
            </div>
          )}

          {data.locationsCount > 1 && (
            <div>
              <label className="text-xs font-semibold text-gray-600">Locations</label>
              <p className="text-sm font-medium">{data.locationsCount}</p>
            </div>
          )}

          {data.nextActionDate && (
            <div>
              <label className="text-xs font-semibold text-gray-600">Next Action Date</label>
              <p className="text-sm font-medium">
                {new Date(data.nextActionDate).toLocaleDateString()}
              </p>
            </div>
          )}

          {data.nextAction && (
            <div>
              <label className="text-xs font-semibold text-gray-600">Next Action</label>
              <p className="text-sm">{data.nextAction}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
