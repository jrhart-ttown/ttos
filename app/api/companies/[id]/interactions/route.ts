import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const data = await request.json()

  try {
    const interaction = await prisma.interaction.create({
      data: {
        companyId: params.id,
        contactId: data.contactId || undefined,
        date: new Date(data.date),
        channel: data.channel,
        summary: data.summary,
        painPoints: data.painPoints || undefined,
        contractTiming: data.contractTiming || undefined,
        referralsDiscussed: data.referralsDiscussed || undefined,
        nextSteps: data.nextSteps || undefined,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
      },
    })

    // Update company's nextActionDate if followUpDate is set
    if (data.followUpDate) {
      await prisma.company.update({
        where: { id: params.id },
        data: {
          nextActionDate: new Date(data.followUpDate),
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
