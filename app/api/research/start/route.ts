import { NextRequest, NextResponse } from 'next/server'
import { importProspectsForIndustry } from '@/lib/research'

// Comprehensive Tulsa metro prospect database (simulating web scraping results)
// Real system would scrape Google Maps, business directories, etc.

const PROSPECT_DATABASE: Record<string, Array<{ name: string; address: string; city: string; phone: string; website: string; businessType: string }>> = {
  dental: [
    { name: 'Tulsa Dental Studio', address: '1234 E 21st St', city: 'Tulsa', phone: '918-555-0101', website: 'tulsadental.com', businessType: 'dental' },
    { name: 'Bright Smile Dentistry', address: '5678 S Yale Ave', city: 'Tulsa', phone: '918-555-0102', website: 'brightsmile.com', businessType: 'dental' },
    { name: 'Family Dental Care', address: '910 N Lewis Ave', city: 'Tulsa', phone: '918-555-0103', website: 'familydental.com', businessType: 'dental' },
    { name: 'Premier Dental Group', address: '2468 E 71st St', city: 'Tulsa', phone: '918-555-0104', website: 'premierdentalgroup.com', businessType: 'dental' },
    { name: 'Cosmetic Dental Solutions', address: '1357 W 15th St', city: 'Tulsa', phone: '918-555-0105', website: 'cosmeticdental.com', businessType: 'dental' },
    { name: 'Downtown Dental Care', address: '222 S Boulder Ave', city: 'Tulsa', phone: '918-555-0106', website: 'downtowndentalcare.com', businessType: 'dental' },
    { name: 'South Tulsa Dentistry', address: '3456 E 21st St', city: 'Tulsa', phone: '918-555-0107', website: 'southtulsadentistry.com', businessType: 'dental' },
    { name: 'Midtown Dental Clinic', address: '789 E 11th St', city: 'Tulsa', phone: '918-555-0108', website: 'midtowndentalclinic.com', businessType: 'dental' },
    { name: 'Jenks Family Dental', address: '1200 W 121st St', city: 'Jenks', phone: '918-555-0109', website: 'jenksfamilydental.com', businessType: 'dental' },
    { name: 'Broken Arrow Dental Arts', address: '900 N Main St', city: 'Broken Arrow', phone: '918-555-0110', website: 'brokendarrowdental.com', businessType: 'dental' },
    { name: 'Owasso Smile Center', address: '12345 N 110th E Ave', city: 'Owasso', phone: '918-555-0111', website: 'owassodental.com', businessType: 'dental' },
    { name: 'Bixby Dental Excellence', address: '5500 S Mingo Rd', city: 'Bixby', phone: '918-555-0112', website: 'bixbydental.com', businessType: 'dental' },
    { name: 'Sand Springs Dental Care', address: '401 W 51st St', city: 'Sand Springs', phone: '918-555-0113', website: 'sandsringsdental.com', businessType: 'dental' },
  ],
  medical: [
    { name: 'Tulsa Medical Center', address: '4500 S Harvard Ave', city: 'Tulsa', phone: '918-555-0201', website: 'tulsamedicalcenter.com', businessType: 'medical' },
    { name: 'HealthCare Partners', address: '2100 E 21st St', city: 'Tulsa', phone: '918-555-0202', website: 'healthcarepartners.com', businessType: 'medical' },
    { name: 'Primary Care Associates', address: '3300 S Pittsburg Ave', city: 'Tulsa', phone: '918-555-0203', website: 'primarycareok.com', businessType: 'medical' },
    { name: 'Family Medicine Clinic', address: '6000 E 21st St', city: 'Tulsa', phone: '918-555-0204', website: 'familymedtulsa.com', businessType: 'medical' },
    { name: 'South Tulsa Medical Group', address: '7777 S Yale Ave', city: 'Tulsa', phone: '918-555-0205', website: 'southtulsamed.com', businessType: 'medical' },
    { name: 'Midtown Health Services', address: '800 S Boulder Ave', city: 'Tulsa', phone: '918-555-0206', website: 'midtownhealth.com', businessType: 'medical' },
    { name: 'Jenks Medical Clinic', address: '1500 W 121st St', city: 'Jenks', phone: '918-555-0207', website: 'jenksmedical.com', businessType: 'medical' },
    { name: 'Broken Arrow Family Medicine', address: '1000 N Main St', city: 'Broken Arrow', phone: '918-555-0208', website: 'bafamilymedicine.com', businessType: 'medical' },
  ],
  church: [
    { name: 'First Baptist Church', address: '709 S Boston Ave', city: 'Tulsa', phone: '918-555-0301', website: 'firstbaptisttulsa.com', businessType: 'church' },
    { name: 'Cain\'s Ballroom Community', address: '423 E 3rd St', city: 'Tulsa', phone: '918-555-0302', website: 'cainsbollroom.com', businessType: 'church' },
    { name: 'Christ Community Church', address: '6700 S Yale Ave', city: 'Tulsa', phone: '918-555-0303', website: 'christcommunitytulsa.com', businessType: 'church' },
    { name: 'College Avenue Methodist', address: '1100 E College Ave', city: 'Tulsa', phone: '918-555-0304', website: 'collegeawemshodist.com', businessType: 'church' },
    { name: 'Eastside Bible Church', address: '3920 E 21st St', city: 'Tulsa', phone: '918-555-0305', website: 'eastbiblechurch.com', businessType: 'church' },
    { name: 'Victory Christian Center', address: '7700 S Lewis Ave', city: 'Tulsa', phone: '918-555-0306', website: 'victorycc.org', businessType: 'church' },
    { name: 'Jenks Community Church', address: '9000 W 121st St', city: 'Jenks', phone: '918-555-0307', website: 'jenkschurch.com', businessType: 'church' },
    { name: 'Broken Arrow Community Chapel', address: '800 N Main St', city: 'Broken Arrow', phone: '918-555-0308', website: 'bachapel.com', businessType: 'church' },
  ],
  industrial: [
    { name: 'Tulsa Manufacturing Corp', address: '2300 S 129th E Ave', city: 'Tulsa', phone: '918-555-0401', website: 'tulsamfg.com', businessType: 'industrial' },
    { name: 'OK Steel Fabricators', address: '4500 E 11th St', city: 'Tulsa', phone: '918-555-0402', website: 'oksteelfa.com', businessType: 'industrial' },
    { name: 'Precision Machine Services', address: '3100 S 129th W Ave', city: 'Tulsa', phone: '918-555-0403', website: 'precisionmachine.com', businessType: 'industrial' },
    { name: 'Industrial Supply & Services', address: '5000 E 21st St', city: 'Tulsa', phone: '918-555-0404', website: 'industrysupply.com', businessType: 'industrial' },
    { name: 'Oilfield Equipment Inc', address: '2000 S 145th E Ave', city: 'Tulsa', phone: '918-555-0405', website: 'oilfieldeq.com', businessType: 'industrial' },
    { name: 'Metal Fabrication Specialists', address: '4000 E 11th St', city: 'Tulsa', phone: '918-555-0406', website: 'metalfab.com', businessType: 'industrial' },
    { name: 'Jenks Manufacturing', address: '1000 W 121st St', city: 'Jenks', phone: '918-555-0407', website: 'jenksmfg.com', businessType: 'industrial' },
    { name: 'BA Industrial Services', address: '500 N Main St', city: 'Broken Arrow', phone: '918-555-0408', website: 'baindustrial.com', businessType: 'industrial' },
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
  const { industryKey } = await request.json()

  if (!industryKey) {
    return NextResponse.json(
      { error: 'industryKey required' },
      { status: 400 }
    )
  }

  try {
    const prospects = PROSPECT_DATABASE[industryKey] || []

    if (prospects.length === 0) {
      return NextResponse.json(
        { error: 'No prospects found for industry' },
        { status: 404 }
      )
    }

    // Import them
    const result = await importProspectsForIndustry(industryKey, prospects)

    return NextResponse.json({
      success: true,
      ...result,
      total: prospects.length,
    })
  } catch (err) {
    console.error('Research error:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
