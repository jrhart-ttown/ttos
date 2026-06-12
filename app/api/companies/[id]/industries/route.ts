import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { industryIds } = await request.json()

  if (!Array.isArray(industryIds)) {
    return NextResponse.json(
      { error: 'industryIds must be an array' },
      { status: 400 }
    )
  }

  try {
    const company = await prisma.company.update({
      where: { id: params.id },
      data: { industryIds },
    })

    return NextResponse.json(company)
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to update industries' },
      { status: 500 }
    )
  }
}
