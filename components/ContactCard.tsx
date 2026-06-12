'use client'

import { useState } from 'react'

const CONTACT_TYPES = [
  'DECISION_MAKER',
  'OFFICE_MANAGER',
  'PRACTICE_ADMIN',
  'OPERATIONS_MANAGER',
  'GENERAL_OFFICE',
  'CONTACT_FORM',
]

export default function ContactCard({ contact }: { contact: any }) {
  const [isEditing, setIsEditing] = useState(false)
  const [contactType, setContactType] = useState(contact.contactType)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (contactType === contact.contactType) {
      setIsEditing(false)
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactType }),
      })

      if (!res.ok) {
        throw new Error('Failed to update contact')
      }

      // Reload page to reflect changes
      window.location.reload()
    } catch (err) {
      alert('Error: ' + (err as Error).message)
      setSaving(false)
    }
  }

  return (
    <div className="p-3 bg-gray-50 rounded border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <div>
          {contact.firstName || contact.lastName ? (
            <p className="font-medium">
              {contact.firstName} {contact.lastName}
            </p>
          ) : (
            <p className="font-medium text-gray-600">No name</p>
          )}
          {contact.title && <p className="text-sm text-gray-600">{contact.title}</p>}
        </div>
        {contact.isPrimary && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
            Primary
          </span>
        )}
      </div>

      <div className="mt-2 space-y-1">
        {contact.email && (
          <p className="text-sm">
            <strong>Email:</strong> {contact.email}
          </p>
        )}
        {contact.phone && (
          <p className="text-sm">
            <strong>Phone:</strong> {contact.phone}
          </p>
        )}

        <div className="pt-2">
          {isEditing ? (
            <div className="flex gap-2 items-center">
              <select
                value={contactType}
                onChange={(e) => setContactType(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
              >
                {CONTACT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? '...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setContactType(contact.contactType)
                  setIsEditing(false)
                }}
                className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-600">
                <strong>Type:</strong> {contactType}
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
