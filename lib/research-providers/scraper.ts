import axios from 'axios'
import * as cheerio from 'cheerio'
import { ResearchProvider, ResearchQuery, ResearchResult, RawProspect } from './types'

const INDUSTRY_SEARCH_TERMS: Record<string, string[]> = {
  dental: ['dentist', 'dental office', 'dental practice'],
  medical: ['doctor office', 'medical clinic', 'urgent care'],
  church: ['church', 'religious organization'],
  industrial: ['manufacturing', 'machine shop'],
  accounting: ['accountant', 'cpa', 'tax service'],
  law: ['attorney', 'law office', 'lawyer'],
  financial: ['financial advisor', 'investment advisor'],
  retreat: ['event venue', 'conference center'],
  education: ['school', 'educational facility'],
}

export class ScraperProvider implements ResearchProvider {
  name = 'Web Scraper'

  isConfigured(): boolean {
    // Scraper is always available (uses public web search)
    return true
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

    try {
      const searchTerms = INDUSTRY_SEARCH_TERMS[query.industryKey] || [query.industryKey]
      const prospects: RawProspect[] = []

      for (const term of searchTerms) {
        try {
          const searchResults = await this.scrapeGoogleSearch(term, query.zipCode, query.city)
          prospects.push(...searchResults)
          result.rawResultCount += searchResults.length
        } catch (err) {
          console.error(`[Scraper] Error searching "${term}":`, err)
        }
      }

      // Dedupe by name + address
      const seen = new Set<string>()
      const deduped: RawProspect[] = []
      for (const p of prospects) {
        const key = `${p.name}|${p.address}`.toLowerCase()
        if (!seen.has(key)) {
          seen.add(key)
          deduped.push(p)
        }
      }

      result.prospects = deduped
      result.validResultCount = deduped.length
    } catch (err) {
      result.error = `Scraper error: ${err instanceof Error ? err.message : String(err)}`
      console.error('[Scraper]', result.error)
    }

    return result
  }

  private async scrapeGoogleSearch(
    term: string,
    zipCode: string,
    city: string
  ): Promise<RawProspect[]> {
    const results: RawProspect[] = []

    try {
      const query = `${term} in ${zipCode} ${city} OK`
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`

      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 10000,
      })

      const $ = cheerio.load(response.data)

      // Extract business listings from search results
      // Note: Google search results structure changes; this is a best-effort approach
      $('div.g').each((_, element) => {
        const titleEl = $(element).find('h3')
        const title = titleEl.text()?.trim()
        const link = $(element).find('a').attr('href')

        if (title && title.length > 3 && !title.toLowerCase().includes('advertisement')) {
          results.push({
            name: title,
            city,
            website: link,
            sourceUrl: link,
          })
        }
      })

      // If Google search didn't work well, try a simpler approach
      if (results.length === 0) {
        console.log(`[Scraper] Google search returned 0 results for "${query}"`)
      }
    } catch (err) {
      console.error(`[Scraper] Error in scrapeGoogleSearch:`, err)
    }

    return results
  }
}
