import { NextRequest, NextResponse } from 'next/server'
import { calculateContactStrategy } from '@/lib/emails'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')
  const contactId = searchParams.get('contactId')

  if (!companyId || !contactId) {
    return NextResponse.json(
      { error: 'companyId and contactId required' },
      { status: 400 }
    )
  }

  try {
    const { strategy, reasoning } = await calculateContactStrategy(
      companyId,
      contactId
    )
    return NextResponse.json({ recommendedApproach: strategy, reasoning })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    )
  }
}
