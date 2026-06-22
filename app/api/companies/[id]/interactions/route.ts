import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const data = await request.json()

  try {
    const parseLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number)
      // Create UTC date to avoid timezone offset issues
      return new Date(Date.UTC(year, month - 1, day))
    }

    const interaction = await prisma.interaction.create({
      data: {
        companyId: params.id,
        contactId: data.contactId || undefined,
        date: parseLocalDate(data.date),
        channel: data.channel,
        summary: data.summary,
        painPoints: data.painPoints || undefined,
        contractTiming: data.contractTiming || undefined,
        referralsDiscussed: data.referralsDiscussed || undefined,
        nextSteps: data.nextSteps || undefined,
        followUpDate: data.followUpDate ? parseLocalDate(data.followUpDate) : undefined,
      },
    })

    // Update company's nextActionDate if followUpDate is set
    if (data.followUpDate) {
      await prisma.company.update({
        where: { id: params.id },
        data: {
          nextActionDate: parseLocalDate(data.followUpDate),
        },
      })
    }

    return NextResponse.json(interaction)
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Failed to log interaction' },
      { status: 500 }
    )
  }
}
