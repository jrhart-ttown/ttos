 export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

export const metadata = {
  title: 'Audit Log | TTOS',
}

export default async function AuditPage() {
  const logs = await prisma.emailLog.findMany({
    include: {
      company: true,
      contact: true,
    },
    orderBy: { sentDate: 'desc' },
    take: 100,
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
        <h1 className="text-3xl font-bold mb-2">Email Activity Audit Log</h1>
        <p className="text-gray-600">
          {logs.length} emails logged
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600">No email activity yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map(log => (
            <div
              key={log.id}
              className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{log.company.name}</h3>
                  <p className="text-sm text-gray-600">
                    {log.contact.firstName} {log.contact.lastName} ({log.contact.email})
                  </p>
                </div>
                <span className="px-3 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                  {touchNames[log.touchNumber] || `Touch ${log.touchNumber}`}
                </span>
              </div>

              <div className="text-sm space-y-1">
                <p>
                  <strong>Subject:</strong> {log.subject}
                </p>
                <p>
                  <strong>Result:</strong>{' '}
                  <span className={
                    log.result === 'PENDING'
                      ? 'text-yellow-700'
                      : log.result === 'NO_RESPONSE'
                      ? 'text-gray-700'
                      : log.result === 'REPLIED'
                      ? 'text-blue-700'
                      : log.result === 'MEETING_SCHEDULED'
                      ? 'text-green-700'
                      : 'text-red-700'
                  }>
                    {log.result}
                  </span>
                </p>
                <p>
                  <strong>Sent:</strong>{' '}
                  {new Date(log.sentDate).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
