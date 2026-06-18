import { ResearchProvider, ResearchQuery, ResearchResult, RawProspect } from './types'

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

export class GooglePlacesProvider implements ResearchProvider {
  name = 'google-places'

  isConfigured(): boolean {
    return !!GOOGLE_PLACES_API_KEY
  }

  async search(query: ResearchQuery): Promise<ResearchResult> {
    const result: ResearchResult = {
      provider: this.name,
      query,
      rawResultCount: 0,
      validResultCount: 0,
      rejectedCount: 0,
      rejectionReasons: {},
      prospects: [],
    }

    if (!this.isConfigured()) {
      result.error = 'Google Places API key not configured'
      return result
    }

    try {
      const prospects: RawProspect[] = []

      for (const term of query.searchTerms) {
        const searchQuery = `${term} in ${query.zipCode} ${query.city} OK`
        console.log(`[GooglePlaces] Searching: "${searchQuery}"`)

        try {
          const rawResults = await this.performSearch(searchQuery)
          result.rawResultCount += rawResults.length

          for (const place of rawResults) {
            const validationResult = this.validatePlace(place, term, query)

            if (validationResult.valid) {
              prospects.push(validationResult.prospect!)
              result.validResultCount++
            } else {
              result.rejectionReasons[validationResult.reason] =
                (result.rejectionReasons[validationResult.reason] || 0) + 1
              result.rejectedCount++
              console.log(
                `[GooglePlaces] Rejected "${place.displayName?.text || 'unknown'}": ${validationResult.reason}`
              )
            }
          }
        } catch (err) {
          console.error(`[GooglePlaces] Error searching "${searchQuery}":`, err)
        }
      }

      result.prospects = prospects
    } catch (err) {
      result.error = `Google Places search failed: ${err instanceof Error ? err.message : String(err)}`
      console.error('[GooglePlaces] Search error:', err)
    }

    return result
  }

  private async performSearch(query: string): Promise<any[]> {
    const url = 'https://places.googleapis.com/v1/places:searchText'
    const body = {
      textQuery: query,
      maxResultCount: 20,
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY!,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google Places API error: ${response.status} ${error}`)
    }

    const data = await response.json()
    return data.places || []
  }

  private validatePlace(
    place: any,
    searchTerm: string,
    query: ResearchQuery
  ): { valid: boolean; prospect?: RawProspect; reason?: string } {
    // Check placeId
    if (!place.id) {
      return { valid: false, reason: 'missing_place_id' }
    }

    // Check displayName
    const name = place.displayName?.text
    if (!name) {
      return { valid: false, reason: 'missing_name' }
    }

    // Check businessStatus (must be OPERATIONAL)
    if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') {
      return { valid: false, reason: `non_operational_${place.businessStatus}` }
    }

    // Reject generic/generated names
    if (this.isGenericOrGeneratedName(name, searchTerm, query.industryKey)) {
      return { valid: false, reason: 'generic_generated_name' }
    }

    // Must have at least one of: address, phone, website
    const hasAddress = place.formattedAddress
    const hasPhone = place.nationalPhoneNumber || place.internationalPhoneNumber
    const hasWebsite = place.websiteUri
    if (!hasAddress && !hasPhone && !hasWebsite) {
      return { valid: false, reason: 'no_contact_info' }
    }

    const prospect: RawProspect = {
      externalSourceId: place.id,
      name,
      address: place.formattedAddress,
      city: query.city,
      phone: place.nationalPhoneNumber || place.internationalPhoneNumber,
      website: place.websiteUri,
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      businessStatus: place.businessStatus,
      sourceUrl: place.googleMapsUri,
    }

    return { valid: true, prospect }
  }

  private isGenericOrGeneratedName(name: string, searchTerm: string, industryKey: string): boolean {
    const nameLower = name.toLowerCase()
    const termLower = searchTerm.toLowerCase()

    // Exact match to search term (e.g., "law offices", "dental offices")
    if (nameLower === termLower) {
      return true
    }

    // Generic patterns: "[City] [Industry]", "[City] [Adjective] [Industry]"
    const patterns = [
      /^(tulsa|broken arrow|jenks|bixby|owasso|sand springs|midtown|south tulsa)\s+(law|dental|medical|accounting|financial|industrial)/i,
      /^(professional|corporate|general)\s+(law|dental|medical|accounting|financial)/i,
      /^(your|new|best|top|grand|golden)\s+\w+\s+(law|office|firm|center|services)/i,
    ]

    if (patterns.some((p) => p.test(name))) {
      return true
    }

    return false
  }
}
