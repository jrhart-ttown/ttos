import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { website, address, city, state, zip } = await request.json()

  try {
    const updateData: any = {}
    if (website !== undefined) updateData.website = website || null
    if (address !== undefined) updateData.address = address || null
    if (city !== undefined) updateData.city = city || null
    if (state !== undefined) updateData.state = state || null
    if (zip !== undefined) updateData.zip = zip || null

    const company = await prisma.company.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(company)
  } catch (err) {
    console.error('Update company details error:', err)
    return NextResponse.json(
      { error: 'Failed to update company details' },
      { status: 500 }
    )
  }
}
