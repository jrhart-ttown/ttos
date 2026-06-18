'use client'

import { useState } from 'react'
import CopyButton from './CopyButton'

export default function EditableContactCard({
  contact,
  onUpdate,
}: {
  contact: any
  onUpdate: (data: any) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    firstName: contact.firstName || '',
    lastName: contact.lastName || '',
    email: contact.email || '',
    phone: contact.phone || '',
    title: contact.title || '',
    contactType: contact.contactType || 'GENERAL_OFFICE',
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
      <div className="p-3 bg-gray-50 rounded border border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-semibold">
              {contact.firstName} {contact.lastName}
            </p>
            {contact.title && <p className="text-xs text-gray-600">{contact.title}</p>}
            {contact.email && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-blue-600">{contact.email}</p>
                <CopyButton value={contact.email} label="📋" />
              </div>
            )}
            {contact.phone && <p className="text-xs text-gray-600">{contact.phone}</p>}
            {contact.contactType && <p className="text-xs text-gray-600 mt-1">{contact.contactType}</p>}
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
    <div className="p-3 bg-blue-50 rounded border border-blue-200">
      <h4 className="font-semibold text-blue-900 mb-3">Edit Contact</h4>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              value={data.firstName}
              onChange={(e) => setData({ ...data, firstName: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              value={data.lastName}
              onChange={(e) => setData({ ...data, lastName: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => setData({ ...data, phone: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Contact Type</label>
          <select
            value={data.contactType}
            onChange={(e) => setData({ ...data, contactType: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          >
            {[
              'DECISION_MAKER',
              'OFFICE_MANAGER',
              'PRACTICE_ADMIN',
              'OPERATIONS_MANAGER',
              'GENERAL_OFFICE',
              'CONTACT_FORM',
            ].map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
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
                firstName: contact.firstName || '',
                lastName: contact.lastName || '',
                email: contact.email || '',
                phone: contact.phone || '',
                title: contact.title || '',
                contactType: contact.contactType || 'GENERAL_OFFICE',
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
