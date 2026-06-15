'use client'

import { useState } from 'react'

export default function TodayLeadCard({
  contact,
  isFollowUp,
  onEmailSent,
}: {
  contact: any
  isFollowUp: boolean
  onEmailSent: () => void
}) {
  const [showEmail, setShowEmail] = useState(false)
  const [email, setEmail] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [strategy, setStrategy] = useState<any>(null)
  const [editingBody, setEditingBody] = useState('')

  const handleGenerateEmail = async () => {
    setLoading(true)
    try {
      const touchNumber = contact.currentTouchNumber || 0
      const res = await fetch(
        `/api/emails/generate?companyId=${contact.companyId}&contactId=${contact.id}&touchNumber=${touchNumber}`
      )
      const data = await res.json()
      setEmail(data)
      setEditingBody(data.body)
      setShowEmail(true)

      // Get contact strategy
      const stratRes = await fetch(
        `/api/emails/strategy?companyId=${contact.companyId}&contactId=${contact.id}`
      )
      const stratData = await stratRes.json()
      setStrategy(stratData)
    } catch (err) {
      alert('Error generating email: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogEmail = async () => {
    if (!email || !result) {
      alert('Please select a result')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/emails/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: contact.companyId,
          contactId: contact.id,
          touchNumber: contact.currentTouchNumber || 0,
          subject: email.subject,
          emailContent: editingBody,
          result,
        }),
      })

      if (!res.ok) throw new Error('Failed to log email')

      alert('Email logged successfully')
      // Reload page to get updated contact cadence
      setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      alert('Error logging email: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold">{contact.company.name}</h3>
          <p className="text-gray-600">
            {contact.firstName} {contact.lastName}
          </p>
          <p className="text-sm text-gray-500">{contact.email}</p>
        </div>
        {strategy && (
          <div className="bg-blue-50 px-3 py-2 rounded text-sm border border-blue-200">
            <p className="font-medium text-blue-900">
              {strategy.recommendedApproach === 'email_first'
                ? 'Email First'
                : strategy.recommendedApproach === 'call_immediately'
                ? 'Call Immediately'
                : strategy.recommendedApproach === 'coordinate_approach'
                ? 'Coordinate'
                : 'Email Only'}
            </p>
            <p className="text-xs text-blue-800 mt-1">{strategy.reasoning}</p>
          </div>
        )}
      </div>

      {/* Email Generation/Display */}
      {!showEmail ? (
        <button
          onClick={handleGenerateEmail}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {loading ? 'Generating...' : 'Generate Email'}
        </button>
      ) : (
        <div className="space-y-4 border-t pt-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={email.subject}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Body
            </label>
            <textarea
              value={editingBody}
              onChange={(e) => setEditingBody(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
            />
          </div>

          {/* Result */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mark as (after sending)
            </label>
            <select
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="">Select result...</option>
              <option value="PENDING">Pending (just sent)</option>
              <option value="NO_RESPONSE">No response expected yet</option>
              <option value="REPLIED">Already replied</option>
              <option value="MEETING_SCHEDULED">Meeting scheduled</option>
              <option value="UNSUBSCRIBED">Unsubscribed</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={handleLogEmail}
              disabled={loading || !result}
              className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              {loading ? 'Logging...' : 'Log Email & Continue'}
            </button>
            <button
              onClick={() => setShowEmail(false)}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded font-medium hover:bg-gray-400 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
