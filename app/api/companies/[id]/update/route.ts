import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { stage, tier, segment, territory, doNotContact } = body

    const updateData: any = {}
    if (stage) updateData.stage = stage
    if (tier) updateData.tier = tier
    if (segment) updateData.segment = segment
    if (territory) updateData.territory = territory
    if (typeof doNotContact === 'boolean') updateData.doNotContact = doNotContact

    const company = await prisma.company.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(company)
  } catch (err) {
    console.error('Update company error:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
