import { prisma } from './prisma'

// Email sequence: Days 0, 4, 8, 11, 17, 24
const CADENCE = [0, 4, 8, 11, 17, 24]

const EMAIL_TEMPLATES = {
  0: {
    subject: 'A more professional approach to {{facility_type}} cleaning',
    body: `Hello {{first_name}},

I'm reaching out because {{company_name}} fits the profile of clients we work best with at T-Town Pristine Clean. We focus on professional facilities that take their space seriously and expect the people maintaining it to do the same.

We're a Tulsa-based commercial cleaning company, and we operate differently from most. I came to this from a finance and consulting background, so I built T-Town around how I'd want a vendor to work with me. Clear communication, reliable execution, no chasing, and someone accountable when something needs attention.

Our anchor client is a multi-building retreat campus here in Tulsa where we're the primary cleaning provider across their conference center, lodge, and chapel. We've grown deliberately, which means clients work with the same vetted crew and the same point of contact every visit.

If your current cleaning arrangement isn't what you'd want it to be, I'd welcome a 15-minute walkthrough of your space to share how we'd approach it. No pressure and no obligation.

If this isn't relevant, reply "unsubscribe" and I'll make sure you don't hear from me again.

Best,
J.R. Hart
Owner, T-Town Pristine Clean
539.233.0353
t-townpristineclean.com`,
  },
  1: {
    subject: '{{company_name}} — quick example',
    body: `Hello {{first_name}},

I wanted to share a quick example of how we've helped similar facilities. Many of the {{facility_type}}s we work with came to us for the same reason: they were tired of their cleaning vendor being something they had to manage.

Our approach is different. You get the same vetted team every visit, proactive communication, and someone accountable when something needs attention. That consistency compounds over time.

If a 15-minute walkthrough makes sense in the next two weeks, I'd appreciate it. No obligation.

Best,
J.R. Hart
Owner, T-Town Pristine Clean
539.233.0353
t-townpristineclean.com`,
  },
  2: {
    subject: 'Following up',
    body: `{{first_name}},

Just following up on the note below. I wanted to make sure it landed.

If your current cleaning arrangement isn't delivering what you'd want, a brief walkthrough could be valuable. If the timing isn't right or you're set on your current provider, no problem — just let me know.

Best,
J.R. Hart
Owner, T-Town Pristine Clean
539.233.0353
t-townpristineclean.com`,
  },
  3: {
    subject: 'The consistency problem in commercial cleaning',
    body: `{{first_name}},

I wanted to share one more thought. The biggest frustration we hear from facilities like {{company_name}} is inconsistency. Different people, different quality, no clear point of contact when something needs attention.

We built T-Town specifically to solve that. Same crew, same contact, reliable execution.

If that resonates, I'd welcome a conversation.

Best,
J.R. Hart
Owner, T-Town Pristine Clean
539.233.0353
t-townpristineclean.com`,
  },
  4: {
    subject: 'Next two weeks work best for us',
    body: `{{first_name}},

I'm reaching back out because scheduling a walkthrough in the next two weeks works best for our calendar. After that, we're pretty booked.

If {{company_name}} is interested in exploring how we'd approach your space, let me know and we can find a time that works.

Best,
J.R. Hart
Owner, T-Town Pristine Clean
539.233.0353
t-townpristineclean.com`,
  },
  5: {
    subject: 'One last thought on professional vendors',
    body: `{{first_name}},

I realize I've sent a few emails, so I'll keep this brief. This is the last one.

The reason I keep coming back is because {{company_name}} fits the profile of clients who benefit most from working with us. But I respect that this might not be the right time.

If that changes, or if you'd like to revisit this down the road, I'm here.

Best,
J.R. Hart
Owner, T-Town Pristine Clean
539.233.0353
t-townpristineclean.com`,
  },
}

export async function generatePersonalizedEmail(
  companyId: string,
  contactId: string,
  touchNumber: number
) {
  const company = await prisma.company.findUnique({ where: { id: companyId } })
  const contact = await prisma.contact.findUnique({ where: { id: contactId } })

  if (!company || !contact) throw new Error('Company or contact not found')

  const template = EMAIL_TEMPLATES[touchNumber as keyof typeof EMAIL_TEMPLATES]
  if (!template) throw new Error(`No template for touch ${touchNumber}`)

  const facilityType = company.industryIds?.length
    ? `${company.industryIds[0]} facility`
    : 'facility'

  const subject = template.subject
    .replace('{{facility_type}}', facilityType)
    .replace('{{company_name}}', company.name)

  const body = template.body
    .replace(/{{first_name}}/g, contact.firstName || 'there')
    .replace(/{{company_name}}/g, company.name)
    .replace(/{{facility_type}}/g, facilityType)

  return { subject, body }
}

export async function calculateContactStrategy(
  companyId: string,
  contactId: string
) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { contacts: true },
  })
  const contact = await prisma.contact.findUnique({ where: { id: contactId } })

  if (!company || !contact) throw new Error('Company or contact not found')

  let strategy = 'email_first'
  let reasoning = ''

  // Multi-location: coordinate approach
  if (company.locationsCount > 1) {
    strategy = 'coordinate_approach'
    reasoning = `${company.locationsCount} locations detected. Coordinate email outreach across contacts.`
  }
  // Solo practice: call immediately
  else if (company.locationsCount === 1 && company.contacts.length <= 2) {
    strategy = 'call_immediately'
    reasoning = 'Solo/small practice. Call opportunity within 24 hours of email.'
  }
  // Decision maker: direct email
  else if (contact.contactType === 'DECISION_MAKER') {
    strategy = 'email_first'
    reasoning = 'Decision maker. Brief, direct email approach.'
  }
  // Operations staff: email emphasizing consistency
  else if (
    contact.contactType === 'OFFICE_MANAGER' ||
    contact.contactType === 'OPERATIONS_MANAGER'
  ) {
    strategy = 'email_first'
    reasoning = 'Operations role. Emphasize consistency and reliability.'
  }
  // Large corporate: email only, multiple touches needed
  else if (company.locationsCount > 5) {
    strategy = 'email_only'
    reasoning = 'Large corporate. Multiple email touches, email-only approach.'
  }

  return { strategy, reasoning }
}

export function getNextFollowUpDate(touchNumber: number): Date {
  if (touchNumber >= CADENCE.length - 1) {
    // After final touch, schedule for 60 days rereach
    const date = new Date()
    date.setDate(date.getDate() + 60)
    return date
  }

  const nextTouch = CADENCE[touchNumber + 1]
  const currentTouch = CADENCE[touchNumber]
  const daysDiff = nextTouch - currentTouch

  const date = new Date()
  date.setDate(date.getDate() + daysDiff)
  return date
}

export async function getFollowUpsDueToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return await prisma.contact.findMany({
    where: {
      nextFollowUpDate: {
        gte: today,
        lt: tomorrow,
      },
      sequenceStatus: {
        in: ['ACTIVE', 'NURTURE_PENDING'],
      },
    },
    include: {
      company: true,
    },
  })
}

export async function logEmail(
  companyId: string,
  contactId: string,
  touchNumber: number,
  subject: string,
  emailContent: string
) {
  const nextFollowUpDate = getNextFollowUpDate(touchNumber)

  const contact = await prisma.contact.update({
    where: { id: contactId },
    data: {
      lastEmailDate: new Date(),
      nextFollowUpDate,
      currentTouchNumber: touchNumber + 1,
      sequenceStatus:
        touchNumber >= CADENCE.length - 1 ? 'NURTURE_PENDING' : 'ACTIVE',
    },
  })

  const emailLog = await prisma.emailLog.create({
    data: {
      companyId,
      contactId,
      touchNumber,
      subject,
      emailContent,
      result: 'PENDING',
    },
  })

  return { contact, emailLog }
}
