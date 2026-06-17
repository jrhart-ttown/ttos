import axios from 'axios'
import * as cheerio from 'cheerio'

interface ScrapedCompany {
  name: string
  address?: string
  city: string
  phone?: string
  website?: string
  businessType: string
}

const INDUSTRY_SEARCH_TERMS = {
  dental: ['dentist', 'dental office', 'orthodontist'],
  medical: ['doctor', 'medical clinic', 'urgent care', 'physician'],
  church: ['church', 'congregation', 'religious organization'],
  industrial: ['manufacturing', 'fabrication', 'machine shop', 'industrial supply'],
  accounting: ['accountant', 'cpa', 'accounting firm', 'tax service'],
  law: ['attorney', 'law firm', 'lawyer'],
  financial: ['financial advisor', 'investment', 'wealth management'],
  retreat: ['event venue', 'conference center', 'retreat center'],
  education: ['school', 'university', 'college', 'educational facility'],
  general_offices: [
    'business office',
    'company office',
    'professional office',
    'office space',
    'corporate office',
    'local business',
    'consulting firm',
    'engineering firm',
    'architecture firm',
    'staffing agency',
    'marketing agency',
    'it company',
    'insurance agency',
    'real estate office',
    'property management',
    'nonprofit office',
  ],
}

export async function scrapeCompanies(
  zipCode: string,
  industryKey: string
): Promise<ScrapedCompany[]> {
  const searchTerms = INDUSTRY_SEARCH_TERMS[industryKey as keyof typeof INDUSTRY_SEARCH_TERMS] || []
  const companies: ScrapedCompany[] = []
  const seenCompanies = new Set<string>()

  for (const term of searchTerms) {
    try {
      console.log(`Scraping ${term} in ${zipCode}...`)

      // Try Google Maps search via scraping
      const mapsResults = await scrapeGoogleMaps(term, zipCode)

      for (const company of mapsResults) {
        const key = `${company.name}|${company.address}`.toLowerCase()
        if (!seenCompanies.has(key)) {
          seenCompanies.add(key)
          company.businessType = industryKey
          companies.push(company)
        }
      }

      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (err) {
      console.error(`Error scraping ${term}:`, err instanceof Error ? err.message : err)
    }
  }

  return companies
}

async function scrapeGoogleMaps(
  searchTerm: string,
  zipCode: string
): Promise<ScrapedCompany[]> {
  const companies: ScrapedCompany[] = []

  try {
    // Construct search query
    const query = `${searchTerm} in ${zipCode}`
    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    }

    const response = await axios.get(url, { headers, timeout: 10000 })
    const $ = cheerio.load(response.data)

    // Parse Google Maps results - selectors may vary
    $('.Nv2PK').each((_, element) => {
      const name = $(element).find('h3').text().trim()
      const address = $(element).find('[data-address-line="0"]').text().trim()
      const phone = $(element).find('[data-phone-number]').text().trim()
      const website = $(element).find('a[href*="http"]').attr('href')

      if (name) {
        companies.push({
          name,
          address: address || '',
          city: extractCityFromZip(zipCode),
          phone: phone || '',
          website: cleanUrl(website),
          businessType: '',
        })
      }
    })

    // Fallback parsing if main selectors don't work
    if (companies.length === 0) {
      $('div[role="button"]').each((_, element) => {
        const text = $(element).text()
        if (text.length > 3) {
          const name = text.split('\n')[0]?.trim()
          if (name && name.length > 2) {
            companies.push({
              name,
              city: extractCityFromZip(zipCode),
              businessType: '',
            })
          }
        }
      })
    }
  } catch (err) {
    console.error('Google Maps scrape error:', err instanceof Error ? err.message : err)
  }

  return companies.slice(0, 15) // Limit to 15 results per search term
}

function extractCityFromZip(zipCode: string): string {
  // Tulsa metro zip codes mapping
  const zipToCityMap: Record<string, string> = {
    '74103': 'Tulsa',
    '74104': 'Tulsa',
    '74105': 'Tulsa',
    '74106': 'Tulsa',
    '74107': 'Tulsa',
    '74108': 'Tulsa',
    '74110': 'Tulsa',
    '74112': 'Tulsa',
    '74114': 'Tulsa',
    '74115': 'Tulsa',
    '74119': 'Tulsa',
    '74120': 'Tulsa',
    '74126': 'Tulsa',
    '74127': 'Tulsa',
    '74128': 'Tulsa',
    '74129': 'Tulsa',
    '74130': 'Tulsa',
    '74131': 'Tulsa',
    '74132': 'Tulsa',
    '74133': 'Tulsa',
    '74134': 'Tulsa',
    '74135': 'Tulsa',
    '74136': 'Tulsa',
    '74137': 'Tulsa',
    '74145': 'Tulsa',
    '74146': 'Tulsa',
    '74150': 'Tulsa',
    '74152': 'Tulsa',
    '74155': 'Tulsa',
    '74008': 'Broken Arrow',
    '74011': 'Broken Arrow',
    '74012': 'Broken Arrow',
    '74014': 'Broken Arrow',
    '74020': 'Jenks',
    '74037': 'Jenks',
    '74063': 'Owasso',
    '74055': 'Bixby',
    '74069': 'Sand Springs',
  }

  return zipToCityMap[zipCode] || 'Tulsa'
}

function cleanUrl(url?: string): string {
  if (!url) return ''

  // Extract domain from URL
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}
