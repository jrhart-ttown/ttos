import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  if (secret !== process.env.INSTANTLY_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Invalid webhook secret' },
      { status: 401 }
    )
  }

  const payload = await request.json()

  // Log raw webhook event
  await prisma.webhookEvent.create({
    data: {
      eventType: payload.event_type || payload.type || 'unknown',
      leadEmail: payload.email || payload.lead_email,
      payload,
      processed: false,
    },
  })

  // Phase 2 will implement event processing
  // For now, just acknowledge receipt

  return NextResponse.json({ success: true })
}
