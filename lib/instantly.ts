const INSTANTLY_BASE_URL = 'https://api.instantly.ai/api/v2'

interface InstantlyLeadData {
  email: string
  first_name?: string
  last_name?: string
  company_name: string
  website?: string
  phone?: string
  personalization: string
  custom_variables?: Record<string, string | number | boolean>
}

export async function pushLeadsToInstantly(
  leads: InstantlyLeadData[],
  campaignId: string
): Promise<{
  success: boolean
  addedCount: number
  skippedCount: number
  errors: any[]
}> {
  const apiKey = process.env.INSTANTLY_API_KEY

  if (!apiKey) {
    throw new Error('INSTANTLY_API_KEY not configured')
  }

  if (!campaignId) {
    throw new Error('Campaign ID required')
  }

  try {
    const response = await fetch(`${INSTANTLY_BASE_URL}/leads/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaign_id: campaignId,
        leads,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Instantly API error: ${response.status} - ${error}`)
    }

    const result = await response.json()

    return {
      success: true,
      addedCount: result.data?.added || 0,
      skippedCount: result.data?.skipped || 0,
      errors: result.data?.errors || [],
    }
  } catch (err) {
    console.error('Instantly API error:', err)
    throw err
  }
}

export function buildInstantlyLead(
  company: any,
  contact: any,
  draft: any
): InstantlyLeadData {
  return {
    email: contact.email,
    first_name: contact.firstName,
    last_name: contact.lastName,
    company_name: company.name,
    website: company.website,
    phone: contact.phone,
    personalization: draft.personalization,
    custom_variables: {
      industry: company.industryIds?.length > 0 ? 'tagged' : 'untagged',
      territory: company.territory,
      tier: company.tier,
      segment: company.segment,
    },
  }
}
