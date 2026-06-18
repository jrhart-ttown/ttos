import { GooglePlacesProvider } from './google-places'
import { ResearchProvider } from './types'

export { ResearchProvider, ResearchQuery, ResearchResult, RawProspect } from './types'

export function getResearchProvider(): ResearchProvider | null {
  const provider = new GooglePlacesProvider()

  if (provider.isConfigured()) {
    return provider
  }

  return null
}

export function requireResearchProvider(): ResearchProvider {
  const provider = getResearchProvider()
  if (!provider) {
    throw new Error(
      'No research provider configured. Set GOOGLE_PLACES_API_KEY environment variable.'
    )
  }
  return provider
}
