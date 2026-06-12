'use client'

import { useState } from 'react'

const CHANNELS = ['EMAIL', 'CALL', 'MEETING', 'WALKTHROUGH', 'EVENT', 'OTHER']

export default function InteractionForm({
  companyId,
  contacts,
}: {
  companyId: string
  contacts: any[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    contactId: contacts[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    channel: 'EMAIL',
    summary: '',
    painPoints: '',
    contractTiming: '',
    referralsDiscussed: '',
    nextSteps: '',
    followUpDate: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/companies/${companyId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        throw new Error('Failed to log interaction')
      }

      // Reset and close form
      setFormData({
        contactId: contacts[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        channel: 'EMAIL',
        summary: '',
        painPoints: '',
        contractTiming: '',
        referralsDiscussed: '',
        nextSteps: '',
        followUpDate: '',
      })
      setIsOpen(false)

      // Reload to show new interaction
      window.location.reload()
    } catch (err) {
      alert('Error: ' + (err as Error).message)
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 mb-6"
      >
        + Log Interaction
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded border border-gray-200 mb-6">
      <h3 className="text-lg font-bold mb-4">Log New Interaction</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Channel</label>
          <select
            name="channel"
            value={formData.channel}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            {CHANNELS.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Contact (optional)</label>
          <select
            name="contactId"
            value={formData.contactId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            <option value="">No contact</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.firstName} {contact.lastName} ({contact.contactType})
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Summary</label>
          <textarea
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="What happened in this interaction?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Pain Points</label>
          <textarea
            name="painPoints"
            value={formData.painPoints}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="Any pain points mentioned?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contract Timing</label>
          <input
            type="text"
            name="contractTiming"
            value={formData.contractTiming}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="e.g., renews October 2026"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Referrals Discussed</label>
          <input
            type="text"
            name="referralsDiscussed"
            value={formData.referralsDiscussed}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Next Steps</label>
          <input
            type="text"
            name="nextSteps"
            value={formData.nextSteps}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Follow-up Date</label>
          <input
            type="date"
            name="followUpDate"
            value={formData.followUpDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Interaction'}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded font-medium hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
