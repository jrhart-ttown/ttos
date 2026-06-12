'use client'

import { useState } from 'react'
import ApprovalDraftCard from './ApprovalDraftCard'

// Hardcoded campaign IDs from env for now
const CAMPAIGNS = {
  BASE_HIT: process.env.NEXT_PUBLIC_CAMPAIGN_BASE_HIT || '',
  WHALE: process.env.NEXT_PUBLIC_CAMPAIGN_WHALE || '',
}

export default function ApprovalQueueView({ drafts }: { drafts: any[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [campaignId, setCampaignId] = useState('')
  const [pushing, setPushing] = useState(false)
  const [message, setMessage] = useState('')

  const handleToggleSelect = (draftId: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(draftId)) {
      newSelected.delete(draftId)
    } else {
      newSelected.add(draftId)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === drafts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(drafts.map(d => d.id)))
    }
  }

  const handlePush = async () => {
    if (!campaignId) {
      setMessage('Please select a campaign')
      return
    }

    if (selectedIds.size === 0) {
      setMessage('Please select at least one draft')
      return
    }

    const selectedDrafts = drafts.filter(d => selectedIds.has(d.id))

    setPushing(true)
    setMessage('')

    try {
      const res = await fetch('/api/drafts/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftIds: Array.from(selectedIds),
          campaignId,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to push drafts')
      }

      setMessage(
        `✓ Pushed ${result.addedCount} drafts to Instantly. ${result.skippedCount || 0} skipped.`
      )

      // Reload page after delay
      setTimeout(() => window.location.reload(), 2000)
    } catch (err) {
      setMessage('✗ Error: ' + (err as Error).message)
    } finally {
      setPushing(false)
    }
  }

  const pendingDrafts = drafts.filter(d => d.status === 'PENDING')
  const approvedDrafts = drafts.filter(d => d.status === 'APPROVED')

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-14 z-10">
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedIds.size === drafts.length && drafts.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">
              {selectedIds.size > 0
                ? `${selectedIds.size} selected`
                : 'Select all'}
            </span>
          </label>

          <select
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="">Choose campaign...</option>
            {CAMPAIGNS.BASE_HIT && (
              <option value={CAMPAIGNS.BASE_HIT}>Base Hit Campaign</option>
            )}
            {CAMPAIGNS.WHALE && (
              <option value={CAMPAIGNS.WHALE}>Whale Campaign</option>
            )}
          </select>

          <button
            onClick={handlePush}
            disabled={pushing || selectedIds.size === 0}
            className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            {pushing ? 'Pushing...' : `Push to Instantly (${selectedIds.size})`}
          </button>
        </div>

        {message && (
          <div className={`p-3 text-sm rounded ${
            message.startsWith('✓')
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Pending Drafts */}
      {pendingDrafts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Awaiting Approval ({pendingDrafts.length})</h2>
          {pendingDrafts.map(draft => (
            <ApprovalDraftCard
              key={draft.id}
              draft={draft}
              isSelected={selectedIds.has(draft.id)}
              onToggle={() => handleToggleSelect(draft.id)}
            />
          ))}
        </div>
      )}

      {/* Approved Drafts */}
      {approvedDrafts.length > 0 && (
        <div className="space-y-4 mt-8">
          <h2 className="text-lg font-bold">Ready to Push ({approvedDrafts.length})</h2>
          <p className="text-sm text-gray-600">Select drafts below to push to Instantly</p>
          {approvedDrafts.map(draft => (
            <ApprovalDraftCard
              key={draft.id}
              draft={draft}
              isSelected={selectedIds.has(draft.id)}
              onToggle={() => handleToggleSelect(draft.id)}
            />
          ))}
        </div>
      )}

      {pendingDrafts.length === 0 && approvedDrafts.length === 0 && (
        <div className="text-center text-gray-600 py-12">
          No drafts yet
        </div>
      )}
    </div>
  )
}
