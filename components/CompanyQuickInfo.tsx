'use client'

import { useState } from 'react'

export default function CompanyQuickInfo({ company, onUpdate }: { company: any; onUpdate: (data: any) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    stage: company.stage,
    tier: company.tier,
    segment: company.segment,
    territory: company.territory,
    doNotContact: company.doNotContact || false,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate(data)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-blue-900">Quick Info</h3>
          <button
            onClick={() => setEditing(true)}
            className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Stage:</span>
            <p className="font-medium">{data.stage}</p>
          </div>
          <div>
            <span className="text-gray-600">Tier:</span>
            <p className="font-medium">{data.tier}</p>
          </div>
          <div>
            <span className="text-gray-600">Segment:</span>
            <p className="font-medium">{data.segment}</p>
          </div>
          <div>
            <span className="text-gray-600">Territory:</span>
            <p className="font-medium">{data.territory}</p>
          </div>
          <div>
            <span className="text-gray-600">Status:</span>
            <p className={`font-medium ${data.doNotContact ? 'text-red-700' : 'text-green-700'}`}>
              {data.doNotContact ? 'Do Not Contact' : 'Active'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-blue-900 mb-4">Edit Quick Info</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
            <select
              value={data.stage}
              onChange={(e) => setData({ ...data, stage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              {['NEW', 'RESEARCHED', 'QUEUED', 'CONTACTED', 'REPLIED', 'WALKTHROUGH_SCHEDULED', 'PROPOSAL_SENT', 'WON', 'LOST', 'NURTURE'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
            <select
              value={data.tier}
              onChange={(e) => setData({ ...data, tier: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              {['UNSCORED', 'A', 'B', 'C'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Segment</label>
            <select
              value={data.segment}
              onChange={(e) => setData({ ...data, segment: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              {['BASE_HIT', 'WHALE'].map((s) => (
                <option key={s} value={s}>
                  {s === 'WHALE' ? '🐋 Whale' : 'Base Hit'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Territory</label>
            <select
              value={data.territory}
              onChange={(e) => setData({ ...data, territory: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              {[
                'SOUTH_TULSA',
                'JENKS',
                'BROKEN_ARROW',
                'BIXBY',
                'MIDTOWN_TULSA',
                'OWASSO',
                'SAND_SPRINGS',
                'SAPULPA',
                'OTHER',
              ].map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="doNotContact"
            checked={data.doNotContact}
            onChange={(e) => setData({ ...data, doNotContact: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="doNotContact" className="text-sm font-medium text-gray-700">
            🚫 Do Not Contact
          </label>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => {
              setData({
                stage: company.stage,
                tier: company.tier,
                segment: company.segment,
                territory: company.territory,
                doNotContact: company.doNotContact || false,
              })
              setEditing(false)
            }}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded text-sm hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
