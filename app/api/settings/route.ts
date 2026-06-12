import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const settings = await prisma.setting.findMany()
    const result: Record<string, string> = {}

    settings.forEach(s => {
      result[s.key] = s.value
    })

    // Include env vars as defaults
    result.INSTANTLY_CAMPAIGN_BASE_HIT = result.INSTANTLY_CAMPAIGN_BASE_HIT || process.env.INSTANTLY_CAMPAIGN_BASE_HIT || ''
    result.INSTANTLY_CAMPAIGN_WHALE = result.INSTANTLY_CAMPAIGN_WHALE || process.env.INSTANTLY_CAMPAIGN_WHALE || ''
    result.INSTANTLY_WEBHOOK_SECRET = result.INSTANTLY_WEBHOOK_SECRET || process.env.INSTANTLY_WEBHOOK_SECRET || ''

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const data = await request.json()

  try {
    for (const [key, value] of Object.entries(data)) {
      if (value) {
        await prisma.setting.upsert({
          where: { key },
          create: { key, value: String(value) },
          update: { value: String(value) },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
