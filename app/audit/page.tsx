import { prisma } from '@/lib/prisma'

export const metadata = {
  title: 'Audit Log | TTOS',
}

export default async function AuditPage() {
  const syncs = await prisma.instantlySync.findMany({
    include: {
      draft: {
        include: { company: true, contact: true },
      },
    },
    orderBy: { pushedAt: 'desc' },
    take: 100,
  })

  return (
    <div className="container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Instantly Sync Audit Log</h1>
        <p className="text-gray-600">
          {syncs.length} sync records
        </p>
      </div>

      {syncs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600">No sync records yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {syncs.map(sync => (
            <div
              key={sync.id}
              className={`p-4 rounded-lg border ${
                sync.status === 'SUCCESS'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">
                    {sync.draft.company.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {sync.draft.contact.email}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    sync.status === 'SUCCESS'
                      ? 'bg-green-200 text-green-800'
                      : 'bg-red-200 text-red-800'
                  }`}
                >
                  {sync.status}
                </span>
              </div>

              <div className="text-sm space-y-1">
                <p>
                  <strong>Campaign:</strong> {sync.campaignId}
                </p>
                <p>
                  <strong>Pushed:</strong>{' '}
                  {new Date(sync.pushedAt).toLocaleString()}
                </p>
                {sync.errorMessage && (
                  <p className="text-red-700">
                    <strong>Error:</strong> {sync.errorMessage}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
