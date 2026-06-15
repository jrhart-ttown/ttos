'use client'

import { useState } from 'react'
import TodayLeadCard from './TodayLeadCard'

export default function TodayDashboard({
  newLeads,
  followUpsDue,
}: {
  newLeads: any[]
  followUpsDue: any[]
}) {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEmailSent = () => {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="space-y-8">
      {/* New Leads Section */}
      {newLeads.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">New Leads ({newLeads.length})</h2>
            <p className="text-sm text-gray-600">
              Pick up to 25 for today's outreach
            </p>
          </div>
          <div className="space-y-4">
            {newLeads.map((contact) => (
              <TodayLeadCard
                key={`new-${contact.id}-${refreshKey}`}
                contact={contact}
                isFollowUp={false}
                onEmailSent={handleEmailSent}
              />
            ))}
          </div>
        </div>
      )}

      {/* Follow-ups Due Section */}
      {followUpsDue.length > 0 && (
        <div className="space-y-4 mt-12 border-t pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              Follow-ups Due Today ({followUpsDue.length})
            </h2>
            <p className="text-sm text-gray-600">
              Send follow-up emails for these contacts
            </p>
          </div>
          <div className="space-y-4">
            {followUpsDue.map((contact) => (
              <TodayLeadCard
                key={`followup-${contact.id}-${refreshKey}`}
                contact={contact}
                isFollowUp={true}
                onEmailSent={handleEmailSent}
              />
            ))}
          </div>
        </div>
      )}

      {newLeads.length === 0 && followUpsDue.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600 text-lg">
            No leads scheduled for today.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Select leads from the Pipeline to add them to today's outreach.
          </p>
        </div>
      )}
    </div>
  )
}
