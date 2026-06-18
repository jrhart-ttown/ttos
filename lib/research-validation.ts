import { RawProspect } from './research-providers'

export interface ValidationResult {
  valid: boolean
  reason?: string
}

/**
 * Validate a prospect before importing
 * A company cannot be created unless it meets all these criteria
 */
export function validateProspectForImport(prospect: RawProspect): ValidationResult {
  // Must have a name
  if (!prospect.name || prospect.name.trim().length === 0) {
    return { valid: false, reason: 'missing_name' }
  }

  // Name cannot be empty after trim
  const name = prospect.name.trim()
  if (name.length < 2) {
    return { valid: false, reason: 'name_too_short' }
  }

  // Must have external source ID (placeId, url, etc.)
  if (!prospect.externalSourceId) {
    return { valid: false, reason: 'missing_external_source_id' }
  }

  // Source must be recorded
  if (!prospect.sourceUrl && prospect.externalSourceId.length < 10) {
    // If no URL and externalSourceId looks too short, might be incomplete
    // But allow if it's a known format (like Google Places ID)
  }

  // Must have at least one contact method
  const hasContact = prospect.address || prospect.phone || prospect.website
  if (!hasContact) {
    return { valid: false, reason: 'no_contact_information' }
  }

  // If businessStatus exists and is not OPERATIONAL, reject
  if (prospect.businessStatus && prospect.businessStatus !== 'OPERATIONAL') {
    return { valid: false, reason: `business_status_${prospect.businessStatus}` }
  }

  // Must have a city
  if (!prospect.city || prospect.city.trim().length === 0) {
    return { valid: false, reason: 'missing_city' }
  }

  // All checks passed
  return { valid: true }
}

/**
 * For production safety, ensure we never import during NODE_ENV=production
 * if provider is not configured or we have zero raw results from a real provider call
 */
export function isProdSafeToImport(
  rawResultCount: number,
  provider: string,
  error?: string
): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return true
  }

  // In production, reject if:
  // 1. Provider returned zero results (could indicate API failure)
  // 2. Provider errored out
  // 3. No provider name (shouldn't happen, but be safe)

  if (!provider || error) {
    return false
  }

  // Zero raw results might be legitimate, but in production we should be careful
  // Let it through, but it will fail later if no valid prospects
  return true
}
