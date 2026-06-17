import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { name } = await request.json()

  if (!name || name.trim().length === 0) {
    return NextResponse.json(
      { error: 'Company name is required' },
      { status: 400 }
    )
  }

  try {
    const company = await prisma.company.update({
      where: { id: params.id },
      data: { name: name.trim() },
    })

    return NextResponse.json(company)
  } catch (err) {
    console.error('Update company name error:', err)
    return NextResponse.json(
      { error: 'Failed to update company name' },
      { status: 500 }
    )
  }
}
