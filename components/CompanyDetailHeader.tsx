'use client'

import Link from 'next/link'

export default function CompanyDetailHeader({ companyId }: { companyId: string }) {
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this company and all related data? This cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/companies/${companyId}/delete`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete company')

      window.location.href = '/pipeline'
    } catch (err) {
      alert('Error: ' + (err as Error).message)
    }
  }

  return (
    <div className="mb-6 flex justify-between items-center">
      <Link href="/pipeline" className="text-blue-600 hover:underline">
        ← Back to Pipeline
      </Link>
      <button
        onClick={handleDelete}
        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
      >
        🗑️ Delete Company
      </button>
    </div>
  )
}
