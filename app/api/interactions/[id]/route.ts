import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const data = await request.json()

  try {
    const parseLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number)
      return new Date(year, month - 1, day)
    }

    const updateData: any = {}
    if (data.date) updateData.date = parseLocalDate(data.date)
    if (data.channel) updateData.channel = data.channel
    if (data.summary !== undefined) updateData.summary = data.summary
    if (data.painPoints !== undefined) updateData.painPoints = data.painPoints || null
    if (data.contractTiming !== undefined) updateData.contractTiming = data.contractTiming || null
    if (data.referralsDiscussed !== undefined) updateData.referralsDiscussed = data.referralsDiscussed || null
    if (data.nextSteps !== undefined) updateData.nextSteps = data.nextSteps || null
    if (data.followUpDate !== undefined) updateData.followUpDate = data.followUpDate ? parseLocalDate(data.followUpDate) : null

    const interaction = await prisma.interaction.update({
      where: { id: params.id },
      data: updateData,
    })

    // Update company's nextActionDate if followUpDate changed
    if (data.followUpDate !== undefined) {
      const company = await prisma.interaction.findUnique({
        where: { id: params.id },
        select: { companyId: true },
      })

      if (company) {
        await prisma.company.update({
          where: { id: company.companyId },
          data: {
            nextActionDate: data.followUpDate ? parseLocalDate(data.followUpDate) : null,
          },
        })
      }
    }

    return NextResponse.json(interaction)
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Failed to update interaction' },
      { status: 500 }
    )
  }
}
