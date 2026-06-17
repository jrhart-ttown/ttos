'use client'

import { useState } from 'react'

export default function EditableCompanyName({
  companyId,
  initialName,
  onUpdate,
}: {
  companyId: string
  initialName: string
  onUpdate?: (name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(initialName)

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Company name cannot be empty')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/companies/${companyId}/name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!res.ok) throw new Error('Failed to update company name')

      onUpdate?.(name.trim())
      setEditing(false)
    } catch (err) {
      alert('Error: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-3xl font-bold">{name}</h1>
        <button
          onClick={() => setEditing(true)}
          className="text-sm px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          title="Edit company name"
        >
          ✏️
        </button>
      </div>
    )
  }

  return (
    <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
      <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded"
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? '...' : 'Save'}
        </button>
        <button
          onClick={() => {
            setName(initialName)
            setEditing(false)
          }}
          className="px-3 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
