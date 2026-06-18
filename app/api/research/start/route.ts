import { NextRequest, NextResponse } from 'next/server'
import { importProspectsForIndustry, getNextTerritory, recordTerritoryResearch, INDUSTRIES } from '@/lib/research'
import { requireResearchProvider } from '@/lib/research-providers'
import { validateProspectForImport, isProdSafeToImport } from '@/lib/research-validation'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { industryKey, zipCode } = body

  if (!industryKey) {
    return NextResponse.json({ error: 'industryKey required' }, { status: 400 })
  }

  try {
    // Get research provider (required, will throw if not configured)
    const provider = requireResearchProvider()
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
        const city = this.extractCityFromZip?.(zip) || 'Tulsa'
        searchQuery.push({
          searchTerms: INDUSTRY_SEARCH_TERMS[industryKey] || [industry.searchTerm],
          zipCode: zip,
          city,
        })
      }
    } else {
      // Advanced override: single ZIP code specified by user
      console.log(`[Research] Manual zip: ${industryKey} in ${zipCode}`)
      const city = this.extractCityFromZip?.(zipCode) || 'Tulsa'
      zipCodes = [zipCode]
      searchQuery.push({
        searchTerms: INDUSTRY_SEARCH_TERMS[industryKey] || [industry.searchTerm],
        zipCode,
        city,
      })
    }

    // Perform research via provider
    const allResults = []
    let totalRawCount = 0
    let totalValidCount = 0
    let totalRejectedCount = 0
    const rejectionSummary: Record<string, number> = {}

    for (const query of searchQuery) {
      const result = await provider.search({
        industryKey,
        ...query,
      })

      allResults.push(result)
      totalRawCount += result.rawResultCount
      totalValidCount += result.validResultCount
      totalRejectedCount += result.rejectedCount

      Object.entries(result.rejectionReasons).forEach(([reason, count]) => {
        rejectionSummary[reason] = (rejectionSummary[reason] || 0) + count
      })

      if (result.error) {
        console.error(`[Research] Provider error for ${query.zipCode}: ${result.error}`)
      }
    }

    // Production safety check
    if (!isProdSafeToImport(totalRawCount, provider.name)) {
      return NextResponse.json(
        {
          error: 'Research provider failed or returned no results. Territory not marked as researched.',
        },
        { status: 400 }
      )
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
      // Check if provider failed
      const providerErrors = allResults.filter((r) => r.error).map((r) => r.error)
      if (providerErrors.length > 0) {
        return NextResponse.json(
          {
            error: `Research provider error: ${providerErrors[0]}`,
            provider: provider.name,
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          error: `No valid companies found for ${industryKey} in ${zipCodes.join(', ')}`,
          rawResults: totalRawCount,
          rejectionReasons: rejectionSummary,
          provider: provider.name,
        },
        { status: 400 }
      )
    }

    // Import through dedup logic
    const importResult = await importProspectsForIndustry(industryKey, validProspects)

    // Record territory as researched (only if we got valid raw results, even if some were rejected)
    if (territoryKey && totalRawCount > 0) {
      await recordTerritoryResearch(industryKey, territoryKey)
    }

    return NextResponse.json({
      success: true,
      ...importResult,
      provider: provider.name,
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
