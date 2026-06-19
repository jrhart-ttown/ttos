import { NextRequest, NextResponse } from 'next/server'
import { importProspectsForIndustry, getNextTerritory, recordTerritoryResearch, INDUSTRIES } from '@/lib/research'
import axios from 'axios'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { industryKey, zipCode } = body

  if (!industryKey) {
    return NextResponse.json({ error: 'industryKey required' }, { status: 400 })
  }

  try {
    const industry = INDUSTRIES[industryKey as keyof typeof INDUSTRIES]
    if (!industry) {
      return NextResponse.json({ error: `Unknown industry: ${industryKey}` }, { status: 400 })
    }

    let territoryKey: string | null = null
    let zipCodes: string[] = []

    // Territory-based research (default) - one zip code at a time
    if (!zipCode) {
      const nextTerritory = await getNextTerritory(industryKey)
      if (!nextTerritory) {
        return NextResponse.json({ error: 'No territories available for this industry' }, { status: 400 })
      }
      territoryKey = nextTerritory.territory
      zipCodes = [nextTerritory.zipCodes[0]]
      console.log(`[Research] Territory: ${industryKey} in ${territoryKey} (${zipCodes[0]})`)
    } else {
      zipCodes = [zipCode]
      console.log(`[Research] Manual: ${industryKey} in ${zipCode}`)
    }

    // Try Google Places first if key exists, then fall back to scraper
    let prospects: any[] = []
    let provider = 'none'

    const hasGoogleKey = !!process.env.GOOGLE_PLACES_API_KEY
    if (hasGoogleKey) {
      prospects = await searchGooglePlaces(industryKey, zipCodes)
      if (prospects.length > 0) {
        provider = 'google-places'
      }
    }

    // If Google Places failed or returned nothing, try scraper
    if (prospects.length === 0) {
      prospects = await scrapeCompanies(industryKey, zipCodes)
      provider = prospects.length > 0 ? 'web-scraper' : provider || 'none'
    }

    if (prospects.length === 0) {
      return NextResponse.json(
        {
          error: `No companies found for ${industryKey} in ${zipCodes.join(', ')}. Attempted providers: ${hasGoogleKey ? 'google-places, web-scraper' : 'web-scraper'}`,
          provider,
        },
        { status: 400 }
      )
    }

    // Import through dedup logic
    const importResult = await importProspectsForIndustry(industryKey, prospects)

    // Record territory as researched
    if (territoryKey && prospects.length > 0) {
      await recordTerritoryResearch(industryKey, territoryKey)
    }

    return NextResponse.json({
      success: true,
      ...importResult,
      provider,
      source: zipCode ? 'manual-zip' : 'territory-engine',
      territoryKey: territoryKey || null,
      zipCodes,
    })
  } catch (err) {
    console.error('[Research] Error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

async function searchGooglePlaces(industryKey: string, zipCodes: string[]) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return []

  const searchTerms = SEARCH_TERMS[industryKey] || [industryKey]
  const prospects: any[] = []

  for (const zipCode of zipCodes) {
    const city = ZIP_CITIES[zipCode] || 'Tulsa'
    for (const term of searchTerms) {
      try {
        const response = await axios.post(
          'https://places.googleapis.com/v1/places:searchText',
          { textQuery: `${term} in ${zipCode} ${city} OK`, maxResultCount: 20 },
          {
            headers: {
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'places.displayName,places.id,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri',
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        )

        console.log(`[GooglePlaces] Response for "${term}" in ${zipCode}:`, JSON.stringify(response.data, null, 2))

        if (response.data.error) {
          console.error(`[GooglePlaces] API error: ${response.data.error.message}`)
          continue
        }

        for (const place of response.data.places || []) {
          if (place.displayName?.text && place.id) {
            prospects.push({
              name: place.displayName.text,
              address: place.formattedAddress,
              city,
              phone: place.nationalPhoneNumber,
              website: place.websiteUri,
              businessType: industryKey,
            })
          }
        }
      } catch (err) {
        console.error(`[GooglePlaces] Error searching "${term}" in ${zipCode}:`, (err as Error).message, (err as any).response?.data)
      }
    }
  }

  return prospects
}

async function scrapeCompanies(industryKey: string, zipCodes: string[]) {
  const searchTerms = SEARCH_TERMS[industryKey] || [industryKey]
  const prospects: any[] = []

  for (const zipCode of zipCodes) {
    const city = ZIP_CITIES[zipCode] || 'Tulsa'
    for (const term of searchTerms) {
      try {
        const query = `${term} in ${zipCode} ${city} OK`
        const response = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          timeout: 10000,
        })

        // Basic extraction - returns minimal results but is reliable fallback
        const matches = response.data.match(/<h3[^>]*>([^<]+)<\/h3>/g) || []
        for (const match of matches.slice(0, 10)) {
          const name = match.replace(/<[^>]*>/g, '').trim()
          if (name && name.length > 2) {
            prospects.push({
              name,
              city,
              businessType: industryKey,
            })
          }
        }
      } catch (err) {
        console.log(`[Scraper] Error searching "${term}" in ${zipCode}`)
      }
    }
  }

  return prospects
}

const SEARCH_TERMS: Record<string, string[]> = {
  dental: ['dentist', 'dental office'],
  medical: ['doctor', 'medical clinic'],
  church: ['church'],
  industrial: ['manufacturing'],
  accounting: ['accountant', 'cpa'],
  law: ['attorney', 'law firm'],
  financial: ['financial advisor'],
  retreat: ['event venue', 'conference center'],
  childcare: ['preschool', 'daycare', 'after school care', 'learning center', 'childcare facility', 'kids club'],
  general_business: [
    'insurance agency',
    'consulting firm',
    'engineering firm',
    'architecture firm',
    'marketing agency',
    'advertising agency',
    'staffing agency',
    'recruiting firm',
    'real estate office',
    'real estate brokerage',
    'property management company',
    'title company',
    'surveying firm',
    'business consulting',
    'IT services',
    'managed IT services',
    'software company',
    'general contractor office',
    'construction office',
    'logistics company',
    'freight broker',
  ],
}

const ZIP_CITIES: Record<string, string> = {
  '74103': 'Tulsa', '74104': 'Tulsa', '74105': 'Tulsa', '74114': 'Tulsa', '74135': 'Tulsa',
  '74008': 'Broken Arrow', '74011': 'Broken Arrow', '74020': 'Jenks', '74063': 'Owasso', '74055': 'Bixby',
}
