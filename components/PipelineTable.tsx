'use client'

import Link from 'next/link'
import StageChangeForm from './StageChangeForm'

interface Company {
  id: string
  name: string
  city?: string | null
  tier: string
  stage: string
  territory: string
  segment: string
  nextActionDate: Date | null
  estMonthlyValue?: number | null
  industryIds: string[]
  contacts: any[]
  interactions: any[]
  emailLogs: any[]
}

function getLastTouchSummary(interaction: any, emailLog: any): string {
  // Prefer recent email log
  if (emailLog && emailLog.sentDate) {
    const date = new Date(emailLog.sentDate).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
    })
    const channelMap: Record<string, string> = {
      EMAIL: 'Email',
      CALL: 'Call',
      MEETING: 'Meeting',
    }
    const channel = channelMap['EMAIL'] || 'Contact'
    return `${channel} — ${date}`
  }

  if (interaction && interaction.date) {
    const date = new Date(interaction.date).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
    })
    const channelMap: Record<string, string> = {
      EMAIL: 'Email',
      CALL: 'Call',
      MEETING: 'Meeting',
      WALKTHROUGH: 'Walkthrough',
      EVENT: 'Event',
      OTHER: 'Contact',
    }
    const channel = channelMap[interaction.channel] || interaction.channel
    return `${channel} — ${date}`
  }

  return 'No touch yet'
}

function getOutcome(emailLog: any, stage: string): string {
  if (emailLog?.result) {
    const resultMap: Record<string, string> = {
      PENDING: 'Pending',
      NO_RESPONSE: 'No reply',
      REPLIED: 'Replied',
      MEETING_SCHEDULED: 'Meeting scheduled',
      UNSUBSCRIBED: 'Unsubscribed',
    }
    return resultMap[emailLog.result] || emailLog.result
  }

  const stageOutcomeMap: Record<string, string> = {
    REPLIED: 'Replied',
    WALKTHROUGH_SCHEDULED: 'Walkthrough scheduled',
    PROPOSAL_SENT: 'Proposal sent',
    WON: 'Won',
    LOST: 'Lost',
    CONTACTED: 'Contacted',
  }

  return stageOutcomeMap[stage] || '—'
}

function getDueDate(nextActionDate: Date | null): string {
  if (!nextActionDate) return 'No next action'

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const actionDate = new Date(
    nextActionDate.getFullYear(),
    nextActionDate.getMonth(),
    nextActionDate.getDate()
  )

  if (actionDate < today) {
    const daysOverdue = Math.floor((today.getTime() - actionDate.getTime()) / (1000 * 60 * 60 * 24))
    return `${daysOverdue}d overdue`
  } else if (actionDate.getTime() === today.getTime()) {
    return 'Today'
  } else {
    const daysUntil = Math.floor((actionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return `In ${daysUntil}d`
  }
}

function getDueDateColor(
  nextActionDate: Date | null,
  stage: string
): string {
  if (['WON', 'LOST', 'NURTURE'].includes(stage)) {
    return 'text-gray-500'
  }

  if (!nextActionDate) {
    return 'text-red-700 font-semibold'
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const actionDate = new Date(
    nextActionDate.getFullYear(),
    nextActionDate.getMonth(),
    nextActionDate.getDate()
  )

  if (actionDate < today) {
    return 'text-red-700 font-semibold bg-red-50 px-2 py-1 rounded'
  } else if (actionDate.getTime() === today.getTime()) {
    return 'text-orange-700 font-semibold bg-orange-50 px-2 py-1 rounded'
  }

  return 'text-gray-600'
}

export default function PipelineTable({ companies }: { companies: Company[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-gray-900 w-1/6">
              Company
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-900 w-1/12">
              Segment
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-900 w-1/12">
              Tier
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-900 w-1/12">
              Contact
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-900 w-1/12">
              Last Touch
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-900 w-1/12">
              Outcome
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-900 w-1/12">
              Due Date
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-900 w-1/12">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {companies.map((company) => (
            <tr
              key={company.id}
              className="hover:bg-gray-50 transition"
            >
              {/* Company */}
              <td className="px-4 py-3">
                <Link
                  href={`/companies/${company.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {company.name}
                </Link>
              </td>

              {/* Segment */}
              <td className="px-4 py-3 text-xs">
                <span
                  className={`px-2 py-1 rounded font-medium ${
                    company.segment === 'WHALE'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {company.segment === 'WHALE' ? 'Whale' : 'Base Hit'}
                </span>
              </td>

              {/* Tier */}
              <td className="px-4 py-3 text-xs">
                <span
                  className={`px-2 py-1 rounded font-medium ${
                    company.tier === 'A'
                      ? 'bg-green-100 text-green-800'
                      : company.tier === 'B'
                      ? 'bg-blue-100 text-blue-800'
                      : company.tier === 'C'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {company.tier}
                </span>
              </td>

              {/* Primary Contact */}
              <td className="px-4 py-3 text-xs text-gray-600">
                {company.contacts[0]
                  ? `${company.contacts[0].firstName || ''} ${company.contacts[0].lastName || ''}`.trim() || company.contacts[0].email
                  : 'No contact'}
              </td>

              {/* Last Touch */}
              <td className="px-4 py-3 text-xs text-gray-600">
                {getLastTouchSummary(
                  company.interactions[0],
                  company.emailLogs[0]
                )}
              </td>

              {/* Outcome */}
              <td className="px-4 py-3 text-xs">
                <span className="text-gray-700">
                  {getOutcome(company.emailLogs[0], company.stage)}
                </span>
              </td>

              {/* Due Date */}
              <td className={`px-4 py-3 text-xs ${getDueDateColor(company.nextActionDate, company.stage)}`}>
                {getDueDate(company.nextActionDate)}
              </td>

              {/* Actions */}
              <td className="px-4 py-3 text-xs">
                <Link
                  href={`/companies/${company.id}`}
                  className="text-blue-600 hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
