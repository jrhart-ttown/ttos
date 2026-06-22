'use client'

import Link from 'next/link'

export default function PipelineSummaryCards({
  allCompanies,
  activeFilter,
}: {
  allCompanies: any[]
  activeFilter?: string
}) {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const today = new Date(todayStr)
  const tomorrowDate = new Date(now)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = tomorrowDate

  // Calculate key metrics
  const overdue = allCompanies.filter(
    (c) =>
      c.nextActionDate &&
      c.nextActionDate < today &&
      !['WON', 'LOST', 'NURTURE'].includes(c.stage)
  ).length

  const dueToday = allCompanies.filter(
    (c) =>
      c.nextActionDate &&
      c.nextActionDate >= today &&
      c.nextActionDate < tomorrow
  ).length

  const noNextAction = allCompanies.filter(
    (c) =>
      !c.nextActionDate &&
      !['WON', 'LOST', 'NURTURE'].includes(c.stage)
  ).length

  const hotReplies = allCompanies.filter(
    (c) => c.stage === 'REPLIED' || c.stage === 'WALKTHROUGH_SCHEDULED'
  ).length

  const proposalsOut = allCompanies.filter(
    (c) => c.stage === 'PROPOSAL_SENT'
  ).length

  const whales = allCompanies.filter(
    (c) => c.segment === 'WHALE'
  ).length

  const readyToContact = allCompanies.filter(
    (c) => c.stage === 'CONTACTED'
  ).length

  const cards = [
    {
      key: 'overdue',
      label: 'Overdue',
      count: overdue,
      color: 'red',
      icon: '🚨',
      link: '/pipeline?quickfilter=overdue',
    },
    {
      key: 'today',
      label: 'Due Today',
      count: dueToday,
      color: 'orange',
      icon: '📅',
      link: '/pipeline?quickfilter=today',
    },
    {
      key: 'hot-replies',
      label: 'Hot Replies',
      count: hotReplies,
      color: 'green',
      icon: '💬',
      link: '/pipeline?quickfilter=hot-replies',
    },
    {
      key: 'proposals-out',
      label: 'Proposals Out',
      count: proposalsOut,
      color: 'blue',
      icon: '📄',
      link: '/pipeline?quickfilter=proposals-out',
    },
    {
      key: 'whales',
      label: 'Whales',
      count: whales,
      color: 'purple',
      icon: '🐋',
      link: '/pipeline?quickfilter=whales',
    },
    {
      key: 'ready-contact',
      label: 'Ready to Contact',
      count: readyToContact,
      color: 'cyan',
      icon: '📞',
      link: '/pipeline?quickfilter=ready-contact',
    },
  ]

  const colorClasses: Record<string, string> = {
    red: 'bg-red-50 border-red-200 text-red-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    cyan: 'bg-cyan-50 border-cyan-200 text-cyan-900',
  }

  return (
    <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <Link
          key={card.key}
          href={card.link}
          className={`p-4 rounded-lg border-2 transition ${colorClasses[card.color]} ${
            activeFilter === card.key ? 'ring-2 ring-offset-2' : 'hover:shadow-md'
          }`}
        >
          <div className="text-2xl mb-1">{card.icon}</div>
          <div className="text-sm font-semibold">{card.count}</div>
          <div className="text-xs opacity-75">{card.label}</div>
        </Link>
      ))}
    </div>
  )
}
