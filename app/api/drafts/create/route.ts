import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { companyId, contactId, personalization, emailBody } = await request.json()

  if (!companyId || !contactId || !personalization || !emailBody) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  try {
    const draft = await prisma.draft.create({
      data: {
        companyId,
        contactId,
        personalization,
        emailBody,
        status: 'PENDING',
      },
    })

    return NextResponse.json(draft)
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Failed to create draft' },
      { status: 500 }
    )
  }
}
