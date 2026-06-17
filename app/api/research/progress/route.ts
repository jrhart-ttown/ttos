import { NextRequest, NextResponse } from 'next/server'
import { getResearchProgress } from '@/lib/research'

export async function GET(request: NextRequest) {
  const industryKey = request.nextUrl.searchParams.get('industryKey')

  if (!industryKey) {
    return NextResponse.json(
      { error: 'industryKey required' },
      { status: 400 }
    )
  }

  try {
    const progress = await getResearchProgress(industryKey)
    return NextResponse.json(progress)
  } catch (err) {
    console.error('Error fetching research progress:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
