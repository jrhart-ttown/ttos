export interface ResearchQuery {
  industryKey: string
  searchTerms: string[]
  zipCode: string
  city: string
}

export interface RawProspect {
  externalSourceId?: string // placeId, url, or unique identifier from provider
  name: string
  address?: string
  city: string
  phone?: string
  website?: string
  rating?: number
  userRatingCount?: number
  businessStatus?: string
  sourceUrl?: string
}

export interface ResearchResult {
  provider: string
  query: ResearchQuery
  rawResultCount: number
  validResultCount: number
  rejectedCount: number
  rejectionReasons: Record<string, number>
  prospects: RawProspect[]
  error?: string
}

export interface ResearchProvider {
  name: string
  isConfigured(): boolean
  search(query: ResearchQuery): Promise<ResearchResult>
}
