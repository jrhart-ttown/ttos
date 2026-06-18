import { NextRequest, NextResponse } from 'next/server'
import { importProspectsForIndustry, getNextTerritory, recordTerritoryResearch, INDUSTRIES } from '@/lib/research'
import { searchWithFallback } from '@/lib/research-providers'
import { validateProspectForImport, isProdSafeToImport } from '@/lib/research-validation'

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
    let searchQuery: { searchTerms: string[]; zipCode: string; city: string }[] = []

    // Territory-based research (default): auto-select next territory
    if (!zipCode) {
      const nextTerritory = await getNextTerritory(industryKey)
      if (!nextTerritory) {
        return NextResponse.json(
          { error: 'No territories available for this industry' },
          { status: 400 }
        )
      }

      territoryKey = nextTerritory.territory
      zipCodes = nextTerritory.zipCodes

      console.log(`[Research] Territory-based: ${industryKey} in ${territoryKey} (${zipCodes.join(', ')})`)

      for (const zip of zipCodes) {
        const city = extractCityFromZip(zip)
        searchQuery.push({
          searchTerms: INDUSTRY_SEARCH_TERMS[industryKey] || [industry.searchTerm],
          zipCode: zip,
          city,
        })
      }
    } else {
      // Advanced override: single ZIP code specified by user
      console.log(`[Research] Manual zip: ${industryKey} in ${zipCode}`)
      const city = extractCityFromZip(zipCode)
      zipCodes = [zipCode]
      searchQuery.push({
        searchTerms: INDUSTRY_SEARCH_TERMS[industryKey] || [industry.searchTerm],
        zipCode,
        city,
      })
    }

    // Perform research with fallback providers
    const allResults = []
    let totalRawCount = 0
    let totalValidCount = 0
    let totalRejectedCount = 0
    const rejectionSummary: Record<string, number> = {}
    let usedProvider = ''

    for (const query of searchQuery) {
      const result = await searchWithFallback({
        industryKey,
        ...query,
      })

      allResults.push(result)
      usedProvider = result.provider
      totalRawCount += result.rawResultCount
      totalValidCount += result.validResultCount
      totalRejectedCount += result.rejectedCount

      Object.entries(result.rejectionReasons).forEach(([reason, count]) => {
        rejectionSummary[reason] = (rejectionSummary[reason] || 0) + count
      })

      if (result.error) {
        console.warn(`[Research] Provider ${result.provider} error: ${result.error}`)
      } else {
        console.log(
          `[Research] ${result.provider} found ${result.rawResultCount} results for ${query.zipCode}`
        )
      }
    }

    // Validate and collect prospects
    const validProspects = allResults
      .flatMap((r) => r.prospects)
      .filter((prospect) => {
        const validation = validateProspectForImport(prospect)
        if (!validation.valid) {
          console.log(`[Research] Prospect validation failed: ${prospect.name} - ${validation.reason}`)
        }
        return validation.valid
      })

    if (validProspects.length === 0) {
      const errorMsg =
        totalRawCount === 0
          ? `No companies found for ${industryKey} in ${zipCodes.join(', ')}. Provider: ${usedProvider}`
          : `Found ${totalRawCount} results but none passed validation. Rejection reasons: ${Object.entries(rejectionSummary)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ')}`

      return NextResponse.json(
        {
          error: errorMsg,
          provider: usedProvider,
          rawResults: totalRawCount,
          rejectionReasons: rejectionSummary,
        },
        { status: 400 }
      )
    }

    // Import through dedup logic
    const importResult = await importProspectsForIndustry(industryKey, validProspects)

    // Record territory as researched (only if we got valid raw results)
    if (territoryKey && totalRawCount > 0) {
      await recordTerritoryResearch(industryKey, territoryKey)
    }

    return NextResponse.json({
      success: true,
      ...importResult,
      provider: usedProvider,
      source: zipCode ? 'manual-zip' : 'territory-engine',
      territoryKey: territoryKey || null,
      zipCodes,
      research: {
        rawResultCount: totalRawCount,
        validResultCount: totalValidCount,
        rejectedCount: totalRejectedCount,
        rejectionReasons: rejectionSummary,
      },
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('[Research] Error:', errorMsg)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

const INDUSTRY_SEARCH_TERMS: Record<string, string[]> = {
  dental: ['dentist', 'dental office', 'dental practice', 'orthodontist'],
  medical: ['doctor office', 'medical clinic', 'urgent care', 'physician office'],
  church: ['church', 'religious organization', 'place of worship'],
  industrial: ['manufacturing', 'machine shop', 'fabrication shop', 'industrial supply'],
  accounting: ['accountant', 'cpa', 'tax service', 'accounting firm'],
  law: ['attorney', 'law office', 'lawyer', 'law firm'],
  financial: ['financial advisor', 'investment advisor', 'wealth management'],
  retreat: ['event venue', 'conference center', 'retreat center', 'event space'],
  education: ['school', 'educational facility', 'university office', 'college'],
  general_offices: ['business office', 'company office', 'professional office'],
}

const ZIP_TO_CITY: Record<string, string> = {
  '74103': 'Tulsa',
  '74104': 'Tulsa',
  '74105': 'Tulsa',
  '74114': 'Tulsa',
  '74135': 'Tulsa',
  '74008': 'Broken Arrow',
  '74011': 'Broken Arrow',
  '74012': 'Broken Arrow',
  '74020': 'Jenks',
  '74037': 'Jenks',
  '74063': 'Owasso',
  '74055': 'Bixby',
  '74069': 'Sand Springs',
}

function extractCityFromZip(zipCode: string): string {
  return ZIP_TO_CITY[zipCode] || 'Tulsa'
}
