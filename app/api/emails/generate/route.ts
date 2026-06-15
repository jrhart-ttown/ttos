import { NextRequest, NextResponse } from 'next/server'
import { generatePersonalizedEmail } from '@/lib/emails'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')
  const contactId = searchParams.get('contactId')
  const touchNumber = parseInt(searchParams.get('touchNumber') || '0')

  if (!companyId || !contactId) {
    return NextResponse.json(
      { error: 'companyId and contactId required' },
      { status: 400 }
    )
  }

  try {
    const { subject, body } = await generatePersonalizedEmail(
      companyId,
      contactId,
      touchNumber
    )
    return NextResponse.json({ subject, body })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    )
  }
}
