import { NextRequest, NextResponse } from 'next/server'
import { getIndustryStats, getIndustryDepletionWarning } from '@/lib/research'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const industryKey = searchParams.get('industryKey')

  if (!industryKey) {
    return NextResponse.json(
      { error: 'industryKey required' },
      { status: 400 }
    )
  }

  try {
    const stats = await getIndustryStats(industryKey)
    const warning = await getIndustryDepletionWarning(industryKey)

    return NextResponse.json({
      ...stats,
      warning,
    })
  } catch (err) {
    console.error('Stats error:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
