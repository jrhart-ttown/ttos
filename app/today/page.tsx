import { prisma } from '@/lib/prisma'
import TodayDashboard from '@/components/TodayDashboard'
import { getFollowUpsDueToday } from '@/lib/emails'

export default async function TodayPage() {
  const followUpsDue = await getFollowUpsDueToday()

  const selectedForToday = await prisma.contact.findMany({
    where: {
      sequenceStatus: 'NEW',
      currentTouchNumber: 0,
    },
    include: {
      company: true,
    },
    take: 25,
  })

  return (
    <div className="container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Today's Outreach</h1>
        <p className="text-gray-600">
          {selectedForToday.length} new leads · {followUpsDue.length} follow-ups
          due
        </p>
      </div>

      <TodayDashboard
        newLeads={selectedForToday}
        followUpsDue={followUpsDue}
      />
    </div>
  )
}
