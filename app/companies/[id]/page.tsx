import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import CompanyDetailView from '@/components/CompanyDetailView'
import InteractionForm from '@/components/InteractionForm'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Company | TTOS',
}

export default async function CompanyDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      contacts: true,
      interactions: {
        orderBy: { date: 'desc' },
      },
      triggerEvents: true,
      whaleMilestones: {
        orderBy: { date: 'desc' },
      },
      drafts: true,
    },
  })

  if (!company) {
    notFound()
  }

  return (
    <div className="container">
      <div className="mb-6">
        <Link href="/pipeline" className="text-blue-600 hover:underline">
          ← Back to Pipeline
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <CompanyDetailView company={company} />

          <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Relationship Ledger</h2>
            <InteractionForm companyId={company.id} contacts={company.contacts} />

            <div className="mt-6">
              {company.interactions.length > 0 ? (
                <div className="space-y-4">
                  {company.interactions.map((interaction) => (
                    <div key={interaction.id} className="p-4 bg-gray-50 rounded border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold">{interaction.channel}</span>
                        <span className="text-sm text-gray-600">
                          {new Date(interaction.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{interaction.summary}</p>
                      {interaction.contractTiming && (
                        <p className="text-xs text-gray-600 mb-1">
                          <strong>Contract timing:</strong> {interaction.contractTiming}
                        </p>
                      )}
                      {interaction.painPoints && (
                        <p className="text-xs text-gray-600 mb-1">
                          <strong>Pain points:</strong> {interaction.painPoints}
                        </p>
                      )}
                      {interaction.nextSteps && (
                        <p className="text-xs text-gray-600">
                          <strong>Next steps:</strong> {interaction.nextSteps}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No interactions logged yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
            <h2 className="text-lg font-bold mb-4">Quick Info</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600">Stage</label>
                <p className="text-sm font-medium">{company.stage}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Tier</label>
                <p className="text-sm font-medium">{company.tier}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Segment</label>
                <p className="text-sm font-medium">{company.segment}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Territory</label>
                <p className="text-sm font-medium">{company.territory}</p>
              </div>

              {company.estMonthlyValue && (
                <div>
                  <label className="text-xs font-semibold text-gray-600">Est. Monthly Value</label>
                  <p className="text-sm font-medium">${company.estMonthlyValue}</p>
                </div>
              )}

              {company.sqftEstimate && (
                <div>
                  <label className="text-xs font-semibold text-gray-600">Sq Ft Estimate</label>
                  <p className="text-sm font-medium">{company.sqftEstimate.toLocaleString()}</p>
                </div>
              )}

              {company.locationsCount > 1 && (
                <div>
                  <label className="text-xs font-semibold text-gray-600">Locations</label>
                  <p className="text-sm font-medium">{company.locationsCount}</p>
                </div>
              )}

              {company.nextActionDate && (
                <div>
                  <label className="text-xs font-semibold text-gray-600">Next Action Date</label>
                  <p className="text-sm font-medium">
                    {new Date(company.nextActionDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {company.nextAction && (
                <div>
                  <label className="text-xs font-semibold text-gray-600">Next Action</label>
                  <p className="text-sm">{company.nextAction}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
