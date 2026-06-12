'use client'

import { useState } from 'react'

export default function ApprovalDraftCard({
  draft,
  isSelected,
  onToggle,
}: {
  draft: any
  isSelected: boolean
  onToggle: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [personalization, setPersonalization] = useState(draft.personalization)
  const [emailBody, setEmailBody] = useState(draft.emailBody)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/drafts/${draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalization, emailBody }),
      })

      if (!res.ok) {
        throw new Error('Failed to save')
      }

      setIsEditing(false)
    } catch (err) {
      alert('Error: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleReject = async () => {
    if (!confirm('Reject this draft?')) return

    try {
      const res = await fetch(`/api/drafts/${draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      })

      if (!res.ok) {
        throw new Error('Failed to reject')
      }

      window.location.reload()
    } catch (err) {
      alert('Error: ' + (err as Error).message)
    }
  }

  const handleApprove = async () => {
    try {
      const res = await fetch(`/api/drafts/${draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      })

      if (!res.ok) {
        throw new Error('Failed to approve')
      }

      window.location.reload()
    } catch (err) {
      alert('Error: ' + (err as Error).message)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gray-50 flex items-center gap-4 border-b border-gray-200">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="w-5 h-5"
        />

        <div className="flex-1">
          <h3 className="font-semibold">{draft.company.name}</h3>
          <p className="text-sm text-gray-600">
            {draft.contact.email} {draft.contact.firstName && `• ${draft.contact.firstName}`}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            {isExpanded ? 'Hide' : 'Show'} Email
          </button>

          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit
              </button>
              <button
                onClick={handleApprove}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={handleReject}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      {/* Personalization preview */}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Personalization (merge field)
              </label>
              <textarea
                value={personalization}
                onChange={(e) => setPersonalization(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Full Email Body
              </label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setPersonalization(draft.personalization)
                  setEmailBody(draft.emailBody)
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded font-medium hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded border border-blue-200">
              <strong>Opening:</strong> {personalization}
            </p>
          </div>
        )}
      </div>

      {/* Full email (expanded) */}
      {isExpanded && !isEditing && (
        <div className="p-4 bg-gray-50 border-t border-gray-200 font-mono text-xs text-gray-700 whitespace-pre-wrap">
          {emailBody}
        </div>
      )}
    </div>
  )
}
