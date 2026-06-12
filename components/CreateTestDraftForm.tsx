'use client'

import { useState } from 'react'

export default function CreateTestDraftForm({ companies }: { companies: any[] }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [selectedContactId, setSelectedContactId] = useState('')
  const [personalization, setPersonalization] = useState(
    'I saw your company is growing fast and thought you might be looking for a reliable cleaning partner.'
  )
  const [emailBody, setEmailBody] = useState(
    `Hi [NAME],

I saw your company is growing fast and thought you might be looking for a reliable cleaning partner.

We work with professional offices like yours to keep spaces clean, professional, and ready for clients. Our team is responsive, detail-oriented, and committed to reliability.

Would you be open to a quick conversation about how we could help?

Best,
T-Town Pristine Clean`
  )
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')

  const selectedCompany = companies.find(c => c.id === selectedCompanyId)
  const contacts = selectedCompany?.contacts || []

  const handleCreate = async () => {
    if (!selectedCompanyId || !selectedContactId) {
      setMessage('Please select a company and contact')
      return
    }

    setCreating(true)
    setMessage('')

    try {
      const res = await fetch('/api/drafts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          contactId: selectedContactId,
          personalization,
          emailBody,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create draft')
      }

      setMessage('✓ Draft created! Refresh to see it in the queue.')
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      setMessage('✗ Error: ' + (err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-bold mb-4">Create Test Draft</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Company</label>
          <select
            value={selectedCompanyId}
            onChange={(e) => {
              setSelectedCompanyId(e.target.value)
              setSelectedContactId('')
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            <option value="">Select a company...</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCompany && (
          <div>
            <label className="block text-sm font-semibold mb-2">Contact</label>
            <select
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">Select a contact...</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-2">Personalization</label>
          <textarea
            value={personalization}
            onChange={(e) => setPersonalization(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
          />
          <p className="text-xs text-gray-600 mt-1">Company-specific opening (merges into Instantly)</p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Email Body</label>
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
          />
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

        <button
          onClick={handleCreate}
          disabled={creating || !selectedCompanyId || !selectedContactId}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create Test Draft'}
        </button>
      </div>
    </div>
  )
}
