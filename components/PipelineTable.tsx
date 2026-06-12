'use client'

import Link from 'next/link'
import StageChangeForm from './StageChangeForm'

interface Company {
  id: string
  name: string
  city: string
  tier: string
  stage: string
  territory: string
  segment: string
  nextActionDate: Date | null
  contacts: any[]
  interactions: any[]
}

export default function PipelineTable({ companies }: { companies: Company[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b-2 border-gray-300">
          <th className="text-left px-4 py-3 font-semibold">Company</th>
          <th className="text-left px-4 py-3 font-semibold">Territory</th>
          <th className="text-left px-4 py-3 font-semibold">Tier</th>
          <th className="text-left px-4 py-3 font-semibold">Stage</th>
          <th className="text-left px-4 py-3 font-semibold">Contacts</th>
          <th className="text-left px-4 py-3 font-semibold">Last Touch</th>
          <th className="text-left px-4 py-3 font-semibold">Next Action</th>
          <th className="text-left px-4 py-3 font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody>
        {companies.map((company) => (
          <tr key={company.id} className="border-b border-gray-200 hover:bg-gray-50">
            <td className="px-4 py-3">
              <Link
                href={`/companies/${company.id}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {company.name}
              </Link>
            </td>
            <td className="px-4 py-3 text-sm">{company.territory}</td>
            <td className="px-4 py-3 text-sm">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                company.tier === 'A' ? 'bg-green-100 text-green-800' :
                company.tier === 'B' ? 'bg-blue-100 text-blue-800' :
                company.tier === 'C' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {company.tier}
              </span>
            </td>
            <td className="px-4 py-3">
              <StageChangeForm companyId={company.id} currentStage={company.stage} />
            </td>
            <td className="px-4 py-3 text-sm">
              {company.contacts.length}
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">
              {company.interactions[0]?.date
                ? new Date(company.interactions[0].date).toLocaleDateString()
                : '—'}
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">
              {company.nextActionDate
                ? new Date(company.nextActionDate).toLocaleDateString()
                : '—'}
            </td>
            <td className="px-4 py-3">
              <Link
                href={`/companies/${company.id}`}
                className="text-blue-600 hover:underline text-sm"
              >
                View
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
