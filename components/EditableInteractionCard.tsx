'use client'

import { useState } from 'react'

const CHANNELS = ['EMAIL', 'CALL', 'MEETING', 'WALKTHROUGH', 'EVENT', 'OTHER']

export default function EditableInteractionCard({
  interaction,
  onUpdate,
}: {
  interaction: any
  onUpdate: (data: any) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    date: interaction.date instanceof Date ? interaction.date.toISOString().split('T')[0] : interaction.date,
    channel: interaction.channel,
    summary: interaction.summary,
    painPoints: interaction.painPoints || '',
    contractTiming: interaction.contractTiming || '',
    referralsDiscussed: interaction.referralsDiscussed || '',
    nextSteps: interaction.nextSteps || '',
    followUpDate: interaction.followUpDate ? (interaction.followUpDate instanceof Date ? interaction.followUpDate.toISOString().split('T')[0] : interaction.followUpDate) : '',
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
      <div className="p-4 bg-gray-50 rounded border border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-900">{interaction.channel}</span>
              <span className="text-xs text-gray-600">
                {new Date(interaction.date).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{interaction.summary}</p>
            {interaction.contractTiming && (
              <p className="text-xs text-gray-600 mb-1">
                <strong>Contract timing:</strong> {interaction.contractTiming}
              </p>
            )}
            {interaction.painPoints && (
              <p className="text-xs text-gray-600 mb-1">
                <strong>Pain points:</strong> {interaction.painPoints}
              </p>
            )}
            {interaction.nextSteps && (
              <p className="text-xs text-gray-600">
                <strong>Next steps:</strong> {interaction.nextSteps}
              </p>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-sm px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-blue-50 rounded border border-blue-200">
      <h4 className="font-semibold text-blue-900 mb-3">Edit Interaction</h4>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={data.date}
              onChange={(e) => setData({ ...data, date: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Channel</label>
            <select
              value={data.channel}
              onChange={(e) => setData({ ...data, channel: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {CHANNELS.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Summary</label>
          <textarea
            value={data.summary}
            onChange={(e) => setData({ ...data, summary: e.target.value })}
            rows={2}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Pain Points</label>
            <textarea
              value={data.painPoints}
              onChange={(e) => setData({ ...data, painPoints: e.target.value })}
              rows={2}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contract Timing</label>
            <input
              type="text"
              value={data.contractTiming}
              onChange={(e) => setData({ ...data, contractTiming: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="e.g., renews October 2026"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Referrals Discussed</label>
            <input
              type="text"
              value={data.referralsDiscussed}
              onChange={(e) => setData({ ...data, referralsDiscussed: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Follow-up Date</label>
            <input
              type="date"
              value={data.followUpDate}
              onChange={(e) => setData({ ...data, followUpDate: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Next Steps</label>
          <textarea
            value={data.nextSteps}
            onChange={(e) => setData({ ...data, nextSteps: e.target.value })}
            rows={2}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => {
              setData({
                date: interaction.date instanceof Date ? interaction.date.toISOString().split('T')[0] : interaction.date,
                channel: interaction.channel,
                summary: interaction.summary,
                painPoints: interaction.painPoints || '',
                contractTiming: interaction.contractTiming || '',
                referralsDiscussed: interaction.referralsDiscussed || '',
                nextSteps: interaction.nextSteps || '',
                followUpDate: interaction.followUpDate ? (interaction.followUpDate instanceof Date ? interaction.followUpDate.toISOString().split('T')[0] : interaction.followUpDate) : '',
              })
              setEditing(false)
            }}
            className="px-3 py-1 bg-gray-300 text-gray-800 rounded text-sm hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
