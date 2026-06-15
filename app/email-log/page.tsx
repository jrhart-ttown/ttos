import { prisma } from '@/lib/prisma'

export default async function EmailLogPage() {
  const emailLogs = await prisma.emailLog.findMany({
    include: {
      company: true,
      contact: true,
    },
    orderBy: { sentDate: 'desc' },
  })

  const touchNames = [
    'Day 0 - Cold Intro',
    'Day 4 - Value Add',
    'Day 8 - Check-in',
    'Day 11 - Pain Point',
    'Day 17 - Urgency',
    'Day 24 - Farewell',
  ]

  return (
    <div className="container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Email Log</h1>
        <p className="text-gray-600">
          {emailLogs.length} emails sent · View all outreach history
        </p>
      </div>

      {emailLogs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600 text-lg">No emails logged yet.</p>
          <p className="text-gray-500 text-sm mt-2">
            Emails will appear here as you send them from the Daily Outreach.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Touch
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Result
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Sent Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {emailLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm">
                    <a
                      href={`/companies/${log.companyId}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {log.company.name}
                    </a>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {log.contact.firstName} {log.contact.lastName}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {touchNames[log.touchNumber] || `Touch ${log.touchNumber}`}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        log.result === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : log.result === 'NO_RESPONSE'
                          ? 'bg-gray-100 text-gray-800'
                          : log.result === 'REPLIED'
                          ? 'bg-blue-100 text-blue-800'
                          : log.result === 'MEETING_SCHEDULED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {log.result === 'PENDING'
                        ? 'Pending'
                        : log.result === 'NO_RESPONSE'
                        ? 'No Response'
                        : log.result === 'REPLIED'
                        ? 'Replied'
                        : log.result === 'MEETING_SCHEDULED'
                        ? 'Meeting Scheduled'
                        : 'Unsubscribed'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {log.sentDate.toLocaleDateString()} at{' '}
                    {log.sentDate.toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
