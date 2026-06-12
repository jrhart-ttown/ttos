import { prisma } from '@/lib/prisma'
import ApprovalQueueView from '@/components/ApprovalQueueView'
import CreateTestDraftForm from '@/components/CreateTestDraftForm'

export default async function ApprovalQueuePage() {
  const drafts = await prisma.draft.findMany({
    where: {
      status: { in: ['PENDING', 'APPROVED'] }
    },
    include: {
      company: {
        include: {
          contacts: true,
        },
      },
      contact: true,
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
  })

  return (
    <div className="container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Approval Queue</h1>
        <p className="text-gray-600">
          {drafts.length} draft{drafts.length !== 1 ? 's' : ''} pending approval
        </p>
      </div>

      {drafts.length === 0 ? (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-600 text-lg">No drafts pending approval.</p>
            <p className="text-gray-500 text-sm mt-2">
              Run a research session to create new drafts, or create a test draft below.
            </p>
          </div>

          <CreateTestDraftForm companies={await prisma.company.findMany({
            include: { contacts: true },
            take: 100,
          })} />
        </div>
      ) : (
        <ApprovalQueueView drafts={drafts} />
      )}
    </div>
  )
}
