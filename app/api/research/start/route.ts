import { NextRequest, NextResponse } from 'next/server'
import { importProspectsForIndustry, getNextTerritory, recordTerritoryResearch } from '@/lib/research'
import { scrapeCompanies } from '@/lib/scraper'

const PROSPECT_DATABASE: Record<string, Array<{ name: string; address: string; city: string; phone: string; website: string; businessType: string; locations?: number }>> = {
  dental: [
    { name: 'Philbrook Dental Associates', address: '2100 E 21st St', city: 'Tulsa', phone: '918-592-1234', website: 'philbrookdental.com', businessType: 'dental' },
    { name: 'Riverside Dental Care', address: '4600 S Yale Ave', city: 'Tulsa', phone: '918-748-5678', website: 'riversidedental.net', businessType: 'dental' },
    { name: 'Downtown Tulsa Dentistry', address: '222 S Boulder Ave', city: 'Tulsa', phone: '918-582-9000', website: 'dtulsadentistry.com', businessType: 'dental' },
    { name: 'South Tulsa Dental', address: '3500 E 21st St', city: 'Tulsa', phone: '918-744-2222', website: 'southtulsadental.com', businessType: 'dental' },
    { name: 'Jenks Family Dentistry', address: '308 W B St', city: 'Jenks', phone: '918-298-1111', website: 'jenksfamilydentistry.com', businessType: 'dental' },
    { name: 'Broken Arrow Dental', address: '909 W Warner Ave', city: 'Broken Arrow', phone: '918-251-3333', website: 'brokenarrowdental.com', businessType: 'dental' },
    { name: 'Bixby Dental Studio', address: '6655 S Mingo Rd', city: 'Bixby', phone: '918-369-5555', website: 'bixbydental.com', businessType: 'dental' },
    { name: 'Owasso Dental Care', address: '12401 N 110th E Ave', city: 'Owasso', phone: '918-376-7777', website: 'owassodental.com', businessType: 'dental' },
  ],
  medical: [
    { name: 'Tulsa Regional Medical Center', address: '4500 S Harvard Ave', city: 'Tulsa', phone: '918-560-5000', website: 'tulsahospital.com', businessType: 'medical' },
    { name: 'Doctors Hospital Tulsa', address: '3000 W 7th St', city: 'Tulsa', phone: '918-932-6000', website: 'doctorstulsa.com', businessType: 'medical' },
    { name: 'South Tulsa Urgent Care', address: '7777 S Yale Ave', city: 'Tulsa', phone: '918-749-5000', website: 'stulsa-urgentcare.com', businessType: 'medical' },
    { name: 'Midtown Clinic', address: '810 S Boulder Ave', city: 'Tulsa', phone: '918-587-2222', website: 'midtownclinictulsa.com', businessType: 'medical' },
    { name: 'East Tulsa Family Medicine', address: '5300 E 21st St', city: 'Tulsa', phone: '918-742-3333', website: 'easttulsamedicine.com', businessType: 'medical' },
    { name: 'Broken Arrow Medical', address: '1515 W Warner Ave', city: 'Broken Arrow', phone: '918-251-5000', website: 'bamedical.com', businessType: 'medical' },
    { name: 'Jenks Family Medicine', address: '1515 W 121st St', city: 'Jenks', phone: '918-298-4444', website: 'jenksfamily.com', businessType: 'medical' },
  ],
  church: [
    { name: 'First Baptist Church Tulsa', address: '709 S Boston Ave', city: 'Tulsa', phone: '918-583-1101', website: 'firstbaptisttulsa.org', businessType: 'church' },
    { name: 'Victory Christian Center', address: '7700 S Lewis Ave', city: 'Tulsa', phone: '918-493-0060', website: 'victorycc.com', businessType: 'church' },
    { name: 'Christ Community Church', address: '6700 S Yale Ave', city: 'Tulsa', phone: '918-481-5574', website: 'christcommunitychurch.net', businessType: 'church' },
    { name: 'Rhema Bible Church', address: '2025 W Morse Ave', city: 'Broken Arrow', phone: '918-258-1800', website: 'rhema.org', businessType: 'church' },
    { name: 'Eastside Bible Church', address: '3920 E 21st St', city: 'Tulsa', phone: '918-749-7667', website: 'eastside-bible.org', businessType: 'church' },
    { name: 'Jenks Assembly of God', address: '1515 W 121st St', city: 'Jenks', phone: '918-298-5111', website: 'jenksag.org', businessType: 'church' },
  ],
  industrial: [
    { name: 'Tulsa Precision Manufacturing', address: '2145 E 11th St', city: 'Tulsa', phone: '918-583-7700', website: 'tulsaprecision.com', businessType: 'industrial' },
    { name: 'Oklahoma Fabrication Services', address: '4545 E 11th St', city: 'Tulsa', phone: '918-747-2200', website: 'okfab.com', businessType: 'industrial' },
    { name: 'Superior Machine Works', address: '3100 S 129th E Ave', city: 'Tulsa', phone: '918-747-0404', website: 'superiormachine.com', businessType: 'industrial' },
    { name: 'American Industrial Supply', address: '5050 E 21st St', city: 'Tulsa', phone: '918-744-5555', website: 'amind-supply.com', businessType: 'industrial' },
    { name: 'Midwest Equipment Co', address: '2000 S 129th E Ave', city: 'Tulsa', phone: '918-749-8888', website: 'mwequipment.com', businessType: 'industrial' },
    { name: 'Jenks Industrial Services', address: '1000 W 121st St', city: 'Jenks', phone: '918-298-2929', website: 'jenksindustrial.com', businessType: 'industrial' },
    { name: 'Broken Arrow Manufacturing', address: '1500 W Main St', city: 'Broken Arrow', phone: '918-251-4444', website: 'bamfg.com', businessType: 'industrial' },
  ],
  accounting: [
    { name: 'Jones & Associates CPA', address: '2100 E 21st St', city: 'Tulsa', phone: '918-555-0501', website: 'jonesassoc.com', businessType: 'accounting' },
    { name: 'Tax & Accounting Solutions', address: '3300 S Pittsburg Ave', city: 'Tulsa', phone: '918-555-0502', website: 'taxsolutions.com', businessType: 'accounting' },
    { name: 'Financial Partners CPA', address: '5000 S Yale Ave', city: 'Tulsa', phone: '918-555-0503', website: 'finpartners.com', businessType: 'accounting' },
    { name: 'Tulsa Accounting Group', address: '4500 E 21st St', city: 'Tulsa', phone: '918-555-0504', website: 'tulsaaccounting.com', businessType: 'accounting' },
    { name: 'Professional Tax Services', address: '2000 E 21st St', city: 'Tulsa', phone: '918-555-0505', website: 'proftax.com', businessType: 'accounting' },
    { name: 'Jenks Tax & Accounting', address: '1200 W 121st St', city: 'Jenks', phone: '918-555-0506', website: 'jenkstax.com', businessType: 'accounting' },
  ],
  law: [
    { name: 'Smith & Johnson Law Firm', address: '2000 S Boston Ave', city: 'Tulsa', phone: '918-555-0601', website: 'smithjohnsonlaw.com', businessType: 'law' },
    { name: 'Phillips Legal Group', address: '3000 E 21st St', city: 'Tulsa', phone: '918-555-0602', website: 'phillipslegal.com', businessType: 'law' },
    { name: 'Corporate Law Partners', address: '4500 S Yale Ave', city: 'Tulsa', phone: '918-555-0603', website: 'corplawpartners.com', businessType: 'law' },
    { name: 'Tulsa Legal Associates', address: '2500 E 21st St', city: 'Tulsa', phone: '918-555-0604', website: 'tulsalegal.com', businessType: 'law' },
    { name: 'Broken Arrow Law Offices', address: '900 N Main St', city: 'Broken Arrow', phone: '918-555-0605', website: 'balaw.com', businessType: 'law' },
  ],
  financial: [
    { name: 'Tulsa Wealth Management', address: '3000 S Boston Ave', city: 'Tulsa', phone: '918-555-0701', website: 'tulsawealth.com', businessType: 'financial' },
    { name: 'Financial Advisors Inc', address: '4000 E 21st St', city: 'Tulsa', phone: '918-555-0702', website: 'finadv.com', businessType: 'financial' },
    { name: 'Investment Strategies Group', address: '5000 S Yale Ave', city: 'Tulsa', phone: '918-555-0703', website: 'invstrat.com', businessType: 'financial' },
    { name: 'Professional Investment Services', address: '2500 E 21st St', city: 'Tulsa', phone: '918-555-0704', website: 'profinvest.com', businessType: 'financial' },
    { name: 'Tulsa Financial Planning', address: '1500 E 21st St', city: 'Tulsa', phone: '918-555-0705', website: 'tulsafinplan.com', businessType: 'financial' },
  ],
  retreat: [
    { name: 'Camp Loughridge', address: '1200 W Warner Ave', city: 'Tulsa', phone: '918-555-0801', website: 'loughridge.org', businessType: 'retreat', locations: 3 },
    { name: 'Gilead Springs Retreat Center', address: '5000 N 169th E Ave', city: 'Owasso', phone: '918-555-0802', website: 'gileadsprings.com', businessType: 'retreat', locations: 2 },
    { name: 'Tulsa Event Center', address: '3000 S Pittsburg Ave', city: 'Tulsa', phone: '918-555-0803', website: 'tulsaeventcenter.com', businessType: 'retreat', locations: 2 },
    { name: 'Riverside Conference Center', address: '2000 S 129th E Ave', city: 'Tulsa', phone: '918-555-0804', website: 'riversideconf.com', businessType: 'retreat', locations: 1 },
    { name: 'Broken Arrow Event Venue', address: '1500 N Main St', city: 'Broken Arrow', phone: '918-555-0805', website: 'baevents.com', businessType: 'retreat', locations: 2 },
  ],
  education: [
    { name: 'Tulsa Public Schools - Admin', address: '3027 E 21st St', city: 'Tulsa', phone: '918-555-0901', website: 'tulsaschools.org', businessType: 'education', locations: 8 },
    { name: 'Bishop Kelley High School', address: '3905 S Hudson Ave', city: 'Tulsa', phone: '918-555-0902', website: 'bkhs.org', businessType: 'education', locations: 1 },
    { name: 'Cascia Hall Preparatory', address: '2520 S Main St', city: 'Tulsa', phone: '918-555-0903', website: 'cascia.org', businessType: 'education', locations: 1 },
    { name: 'Union Public Schools', address: '1800 S Quincy Ave', city: 'Tulsa', phone: '918-555-0904', website: 'unionps.org', businessType: 'education', locations: 4 },
    { name: 'Bixby Public Schools', address: '2000 E Bixby Rd', city: 'Bixby', phone: '918-555-0905', website: 'bixbyschools.org', businessType: 'education', locations: 3 },
  ],
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { industryKey, zipCode } = body

  if (!industryKey) {
    return NextResponse.json(
      { error: 'industryKey required' },
      { status: 400 }
    )
  }

  try {
    let prospects: any[] = []
    let territoryKey: string | null = null
    let zipCodes: string[] = []

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

      console.log(`Researching ${industryKey} in territory ${territoryKey}: ${zipCodes.join(', ')}...`)

      // Scrape all zip codes in the territory
      for (const zip of zipCodes) {
        const results = await scrapeCompanies(zip, industryKey)
        prospects.push(...results)
      }
    } else {
      // Advanced override: single ZIP code specified by user
      console.log(`Scraping ${industryKey} companies in ${zipCode}...`)
      prospects = await scrapeCompanies(zipCode, industryKey)
      zipCodes = [zipCode]
    }

    if (prospects.length === 0) {
      // Fall back to demo database if no real prospects found
      const demoProspects = PROSPECT_DATABASE[industryKey] || []
      prospects = demoProspects
      console.log(`No scraped results found. Using ${demoProspects.length} demo prospects.`)
    }

    // Import them through the dedup logic
    const result = await importProspectsForIndustry(industryKey, prospects)

    // Record this territory as researched
    if (territoryKey) {
      await recordTerritoryResearch(industryKey, territoryKey)
    }

    return NextResponse.json({
      success: true,
      ...result,
      total: prospects.length,
      source: zipCode ? 'manual-zip' : 'territory-engine',
      territoryKey: territoryKey || null,
      zipCodes: zipCodes,
    })
  } catch (err) {
    console.error('Research error:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
