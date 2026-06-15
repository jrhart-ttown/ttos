import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const { contactId } = await request.json()

  if (!contactId) {
    return NextResponse.json(
      { error: 'contactId required' },
      { status: 400 }
    )
  }

  try {
    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        sequenceStatus: 'NEW',
        currentTouchNumber: 0,
      },
    })

    return NextResponse.json({ success: true, contact })
  } catch (err) {
    console.error('Error selecting lead:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
