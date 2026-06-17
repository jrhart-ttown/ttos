'use client'

import { useState } from 'react'
import EditableContactCard from './EditableContactCard'
import EditableCompanyName from './EditableCompanyName'

interface Company {
  id: string
  name: string
  website?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  industryIds?: string[]
  whyTheyFit?: string | null
  createdAt: Date
  source: string
  contacts: any[]
  triggerEvents: any[]
  whaleMilestones: any[]
}

export default function CompanyDetailView({ company }: { company: Company }) {
  const [companyName, setCompanyName] = useState(company.name)
  const [contacts, setContacts] = useState(company.contacts)
  const [website, setWebsite] = useState(company.website || '')
  const [address, setAddress] = useState(company.address || '')
  const [city, setCity] = useState(company.city || '')
  const [editingDetails, setEditingDetails] = useState(false)
  const [savingDetails, setSavingDetails] = useState(false)

  const handleContactUpdate = async (contactId: string, data: any) => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to update contact')

      setContacts(contacts.map((c: any) => (c.id === contactId ? { ...c, ...data } : c)))
    } catch (err) {
      alert('Error updating contact: ' + (err as Error).message)
    }
  }

  const handleSaveDetails = async () => {
    setSavingDetails(true)
    try {
      const res = await fetch(`/api/companies/${company.id}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: website || null, address: address || null, city: city || null }),
      })

      if (!res.ok) throw new Error('Failed to update details')

      setEditingDetails(false)
    } catch (err) {
      alert('Error: ' + (err as Error).message)
    } finally {
      setSavingDetails(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <EditableCompanyName companyId={company.id} initialName={company.name} onUpdate={setCompanyName} />

      {editingDetails ? (
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-blue-50 rounded border border-blue-200">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="e.g., example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., 123 Main St"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Tulsa"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div className="flex gap-2 col-span-2 pt-2">
            <button
              onClick={handleSaveDetails}
              disabled={savingDetails}
              className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {savingDetails ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setWebsite(company.website || '')
                setAddress(company.address || '')
                setCity(company.city || '')
                setEditingDetails(false)
              }}
              className="px-3 py-2 bg-gray-300 text-gray-800 rounded text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="text-sm font-semibold text-gray-600">Website</label>
            {website ? (
              <a
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all text-sm"
              >
                {website}
              </a>
            ) : (
              <p className="text-sm text-gray-500">Not set</p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600">Address</label>
            {address ? (
              <p className="text-sm">
                {address}
                {city && `, ${city}`}
              </p>
            ) : (
              <p className="text-sm text-gray-500">Not set</p>
            )}
          </div>

          <div className="col-span-2">
            <button
              onClick={() => setEditingDetails(true)}
              className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              ✏️ Edit Details
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="text-sm font-semibold text-gray-600">Source</label>
          <p className="text-sm">{company.source}</p>
        </div>
      </div>

      {company.whyTheyFit && (
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-600 block mb-2">Why They Fit</label>
          <p className="text-sm text-gray-700">{company.whyTheyFit}</p>
        </div>
      )}

      {contacts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Contacts</h2>
          <div className="space-y-3">
            {contacts.map((contact: any) => (
              <EditableContactCard
                key={contact.id}
                contact={contact}
                onUpdate={(data) => handleContactUpdate(contact.id, data)}
              />
            ))}
          </div>
        </div>
      )}

      {company.triggerEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Trigger Events</h2>
          <div className="space-y-3">
            {company.triggerEvents.map((event) => (
              <div key={event.id} className="p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="font-medium text-sm">{event.type}</p>
                <p className="text-sm text-gray-700">{event.description}</p>
                {event.eventDate && (
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(event.eventDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
