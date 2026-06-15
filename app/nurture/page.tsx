import { prisma } from '@/lib/prisma'

export default async function NurtureQueuePage() {
  const nurturePending = await prisma.contact.findMany({
    where: {
      sequenceStatus: 'NURTURE_PENDING',
      nextFollowUpDate: {
        lte: new Date(),
      },
    },
    include: {
      company: true,
    },
    orderBy: { nextFollowUpDate: 'asc' },
  })

  const nurtureFuture = await prisma.contact.findMany({
    where: {
      sequenceStatus: 'NURTURE_PENDING',
      nextFollowUpDate: {
        gt: new Date(),
      },
    },
    include: {
      company: true,
    },
    orderBy: { nextFollowUpDate: 'asc' },
  })

  return (
    <div className="container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Nurture Queue</h1>
        <p className="text-gray-600">
          Leads scheduled for 60-day rereach
        </p>
      </div>

      {/* Ready to Rereach */}
      {nurturePending.length > 0 && (
        <div className="space-y-4 mb-12">
          <h2 className="text-xl font-bold">Ready to Rereach ({nurturePending.length})</h2>
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
                    Last Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {nurturePending.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm">
                      <a
                        href={`/companies/${contact.companyId}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {contact.company.name}
                      </a>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {contact.firstName} {contact.lastName}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {contact.lastEmailDate?.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <a
                        href={`/today`}
                        className="text-blue-600 hover:underline"
                      >
                        Start Rereach →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scheduled for Future */}
      {nurtureFuture.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Scheduled ({nurtureFuture.length})</h2>
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
                    Rereach Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Days Until
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {nurtureFuture.map((contact) => {
                  const daysUntil = contact.nextFollowUpDate
                    ? Math.ceil(
                        (contact.nextFollowUpDate.getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : 0
                  return (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm">
                        <a
                          href={`/companies/${contact.companyId}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {contact.company.name}
                        </a>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        {contact.firstName} {contact.lastName}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {contact.nextFollowUpDate?.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {daysUntil} days
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {nurturePending.length === 0 && nurtureFuture.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600 text-lg">No leads in nurture queue yet.</p>
          <p className="text-gray-500 text-sm mt-2">
            Leads will appear here after completing their 6-touch sequence.
          </p>
        </div>
      )}
    </div>
  )
}
