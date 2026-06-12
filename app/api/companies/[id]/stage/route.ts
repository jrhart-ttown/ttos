import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { stage } = await request.json()

  if (!stage) {
    return NextResponse.json(
      { error: 'Stage is required' },
      { status: 400 }
    )
  }

  try {
    const company = await prisma.company.update({
      where: { id: params.id },
      data: { stage },
    })

    return NextResponse.json(company)
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    )
  }
}
