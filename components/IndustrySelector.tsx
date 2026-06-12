'use client'

import { useEffect, useState } from 'react'

interface Industry {
  id: string
  name: string
}

export default function IndustrySelector({
  companyId,
  selectedIds,
  onUpdate,
}: {
  companyId: string
  selectedIds: string[]
  onUpdate: (ids: string[]) => void
}) {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [newIndustry, setNewIndustry] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(selectedIds)

  useEffect(() => {
    fetchIndustries()
  }, [])

  const fetchIndustries = async () => {
    try {
      const res = await fetch('/api/industries')
      const data = await res.json()
      setIndustries(data)
    } catch (err) {
      console.error('Failed to fetch industries', err)
    }
  }

  const handleAddIndustry = async () => {
    if (!newIndustry.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/industries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newIndustry }),
      })

      if (!res.ok) {
        throw new Error('Failed to create industry')
      }

      const newInd = await res.json()
      setIndustries([...industries, newInd].sort((a, b) => a.name.localeCompare(b.name)))
      setNewIndustry('')

      // Auto-select the new industry
      const newSelected = [...selected, newInd.id]
      setSelected(newSelected)
      onUpdate(newSelected)
    } catch (err) {
      alert('Error creating industry: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (industryId: string) => {
    const newSelected = selected.includes(industryId)
      ? selected.filter(id => id !== industryId)
      : [...selected, industryId]

    setSelected(newSelected)
    onUpdate(newSelected)
  }

  const selectedIndustries = industries.filter(i => selected.includes(i.id))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Industries</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedIndustries.map(ind => (
            <button
              key={ind.id}
              onClick={() => handleToggle(ind.id)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-2"
            >
              {ind.name}
              <span>×</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newIndustry}
          onChange={(e) => setNewIndustry(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddIndustry()}
          placeholder="Type new industry..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
        />
        <button
          onClick={handleAddIndustry}
          disabled={loading || !newIndustry.trim()}
          className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? '...' : 'Add'}
        </button>
      </div>

      {industries.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-2">
            Available industries:
          </label>
          <div className="flex flex-wrap gap-2">
            {industries
              .filter(i => !selected.includes(i.id))
              .map(ind => (
                <button
                  key={ind.id}
                  onClick={() => handleToggle(ind.id)}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 border border-gray-300"
                >
                  + {ind.name}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
