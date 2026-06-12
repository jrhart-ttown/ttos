import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { personalization, emailBody, status } = await request.json()

  try {
    const draft = await prisma.draft.update({
      where: { id: params.id },
      data: {
        ...(personalization && { personalization }),
        ...(emailBody && { emailBody }),
        ...(status && { status }),
      },
    })

    return NextResponse.json(draft)
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Failed to update draft' },
      { status: 500 }
    )
  }
}
