import { NextRequest, NextResponse } from 'next/server'
import { logEmail } from '@/lib/emails'

export async function POST(request: NextRequest) {
  const { companyId, contactId, touchNumber, subject, emailContent, result } =
    await request.json()

  if (!companyId || !contactId || touchNumber === undefined) {
    return NextResponse.json(
      { error: 'companyId, contactId, touchNumber required' },
      { status: 400 }
    )
  }

  try {
    const { contact, emailLog } = await logEmail(
      companyId,
      contactId,
      touchNumber,
      subject,
      emailContent
    )

    return NextResponse.json({
      success: true,
      contact,
      emailLog,
    })
  } catch (err) {
    console.error('Error logging email:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
