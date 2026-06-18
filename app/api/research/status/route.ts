import { NextResponse } from 'next/server'
import { getProviderStatus } from '@/lib/research-providers'

export async function GET() {
  const status = getProviderStatus()

  return NextResponse.json({
    providers: status,
    message: status.googlePlaces.configured
      ? 'Google Places API configured. Scraper available as fallback.'
      : 'Google Places API not configured. Using scraper only.',
  })
}
