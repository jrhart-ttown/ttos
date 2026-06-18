import { GooglePlacesProvider } from './google-places'
import { ScraperProvider } from './scraper'
import { ResearchProvider, ResearchResult, ResearchQuery } from './types'

export function getProvidersInOrder(): ResearchProvider[] {
  const providers: ResearchProvider[] = []

  const googlePlaces = new GooglePlacesProvider()
  if (googlePlaces.isConfigured()) {
    providers.push(googlePlaces)
  }

  // Scraper is always available as fallback
  providers.push(new ScraperProvider())

  return providers
}

export function getProviderStatus() {
  return {
    googlePlaces: {
      configured: new GooglePlacesProvider().isConfigured(),
      name: 'Google Places API',
    },
    scraper: {
      configured: true,
      name: 'Web Scraper (Fallback)',
    },
  }
}

/**
 * Search with provider fallback:
 * 1. Try Google Places if configured
 * 2. Fall back to scraper if Google Places fails or unavailable
 * 3. Return results from first successful provider
 * 4. Only fail if all providers fail
 */
export async function searchWithFallback(query: ResearchQuery): Promise<ResearchResult> {
  const providers = getProvidersInOrder()

  if (providers.length === 0) {
    return {
      provider: 'none',
      query,
      rawResultCount: 0,
      validResultCount: 0,
      rejectedCount: 0,
      rejectionReasons: {},
      prospects: [],
      error: 'No research providers available. This should not happen.',
    }
  }

  const errors: { provider: string; error: string }[] = []

  for (const provider of providers) {
    try {
      console.log(`[Research] Trying provider: ${provider.name}`)
      const result = await provider.search(query)

      if (result.error) {
        console.error(`[Research] ${provider.name} returned error: ${result.error}`)
        errors.push({ provider: provider.name, error: result.error })
        continue
      }

      if (result.rawResultCount > 0 || result.prospects.length > 0) {
        console.log(
          `[Research] ${provider.name} succeeded: ${result.rawResultCount} raw, ${result.prospects.length} valid`
        )
        return result
      }

      console.log(`[Research] ${provider.name} returned zero results, trying next provider...`)
      errors.push({ provider: provider.name, error: 'No results' })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error(`[Research] ${provider.name} threw error: ${errorMsg}`)
      errors.push({ provider: provider.name, error: errorMsg })
    }
  }

  // All providers failed
  return {
    provider: 'fallback-chain',
    query,
    rawResultCount: 0,
    validResultCount: 0,
    rejectedCount: 0,
    rejectionReasons: {},
    prospects: [],
    error: `All research providers failed: ${errors.map((e) => `${e.provider}: ${e.error}`).join('; ')}`,
  }
}
