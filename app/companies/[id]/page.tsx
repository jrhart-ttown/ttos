import { prisma } from '@/lib/prisma'
import { findPotentialDuplicates } from '@/lib/leads'
import CompanyDetailView from '@/components/CompanyDetailView'
import CompanyDetailHeader from '@/components/CompanyDetailHeader'
import InteractionForm from '@/components/InteractionForm'
import InteractionsSection from '@/components/InteractionsSection'
import IndustriesSection from '@/components/IndustriesSection'
import CompanyQuickInfoSidebar from '@/components/CompanyQuickInfoSidebar'
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
    },
  })

  if (!company) {
    notFound()
  }

  const potentialDuplicates = await findPotentialDuplicates(company.id)

  return (
    <div className="container">
      <CompanyDetailHeader companyId={company.id} />

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <CompanyDetailView company={company} potentialDuplicates={potentialDuplicates} />

          <IndustriesSection companyId={company.id} initialIndustryIds={company.industryIds} />

          <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Relationship Ledger</h2>
            <InteractionForm companyId={company.id} contacts={company.contacts} />

            <InteractionsSection interactions={company.interactions} />
          </div>
        </div>

        <div className="col-span-1">
          <CompanyQuickInfoSidebar company={company} />
        </div>
      </div>
    </div>
  )
}
