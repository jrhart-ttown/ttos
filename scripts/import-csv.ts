import { config } from 'dotenv'
config({ path: '.env.local' })

import fs from 'fs'
import path from 'path'
import { createInterface } from 'readline'
import { prisma } from '@/lib/prisma'
import { upsertProspect, createDedupKey } from '@/lib/leads'

interface CSVRow {
  [key: string]: string
}

const HEADER_ALIASES: Record<string, string[]> = {
  name: ['company', 'company name', 'name'],
  website: ['website', 'url', 'web'],
  domain: ['domain'],
  address: ['address', 'street'],
  city: ['city'],
  state: ['state', 'st'],
  zip: ['zip', 'zipcode'],
  territory: ['territory', 'region'],
  segment: ['segment', 'type'],
  tier: ['tier', 'level'],
  firstName: ['first name', 'firstname', 'first', 'contact name'],
  lastName: ['last name', 'lastname', 'last'],
  title: ['title', 'position'],
  email: ['email', 'contact email', 'email address'],
  phone: ['phone', 'contact phone', 'phone number'],
  contactType: ['contact type', 'role'],
  estMonthlyValue: ['monthly value', 'est monthly value'],
  sqftEstimate: ['sqft', 'square feet'],
  locationsCount: ['locations', 'location count'],
  whyTheyFit: ['why they fit', 'notes', 'reason'],
}

function fuzzyMatchHeader(header: string, aliases: string[]): boolean {
  const normalized = header.toLowerCase().trim()
  return aliases.some(alias => normalized.includes(alias))
}

function mapHeaders(csvHeaders: string[]): Record<string, number | undefined> {
  const map: Record<string, number | undefined> = {}

  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const index = csvHeaders.findIndex(h => fuzzyMatchHeader(h, aliases))
    if (index !== -1) {
      map[field] = index
    }
  }

  return map
}

function parseCSVLine(line: string): string[] {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

async function askQuestion(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function main() {
  const csvPath = process.argv[2]

  if (!csvPath) {
    console.error('Usage: tsx scripts/import-csv.ts <csv-file-path>')
    process.exit(1)
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`)
    process.exit(1)
  }

  console.log(`Reading CSV from: ${csvPath}`)

  const fileContent = fs.readFileSync(csvPath, 'utf-8')
  const lines = fileContent.split('\n').filter(line => line.trim())

  if (lines.length < 2) {
    console.error('CSV must have headers and at least one data row')
    process.exit(1)
  }

  const headers = parseCSVLine(lines[0])
  const headerMap = mapHeaders(headers)

  console.log('\n📋 Detected headers:')
  console.log(JSON.stringify(headerMap, null, 2))

  const confirmed = await askQuestion(
    '\nDoes this look correct? (yes/no): '
  )

  if (confirmed.toLowerCase() !== 'yes') {
    console.log('Import cancelled.')
    process.exit(0)
  }

  let imported = 0
  let duplicates = 0
  let flagged = 0
  let errors = 0

  console.log('\n🚀 Starting import...\n')

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: CSVRow = {}

    for (const [field, index] of Object.entries(headerMap)) {
      if (index !== undefined && values[index]) {
        row[field] = values[index]
      }
    }

    if (!row.name) {
      console.log(`⚠️  Row ${i + 1}: No company name, skipping`)
      continue
    }

    try {
      const result = await upsertProspect({
        name: row.name,
        website: row.website,
        domain: row.domain,
        address: row.address,
        city: row.city,
        state: row.state || 'OK',
        zip: row.zip,
        territory: row.territory,
        segment: row.segment,
        tier: row.tier,
        estMonthlyValue: row.estMonthlyValue ? parseInt(row.estMonthlyValue) : undefined,
        sqftEstimate: row.sqftEstimate ? parseInt(row.sqftEstimate) : undefined,
        locationsCount: row.locationsCount ? parseInt(row.locationsCount) : 1,
        whyTheyFit: row.whyTheyFit,
        source: 'csv_import',
      })

      if (!result.duplicate) {
        const company = result.company
        imported++

        // Create primary contact if email provided
        if (row.email) {
          await prisma.contact.upsert({
            where: {
              companyId_email: {
                companyId: company.id,
                email: row.email,
              },
            },
            create: {
              companyId: company.id,
              email: row.email,
              firstName: row.firstName,
              lastName: row.lastName,
              title: row.title,
              phone: row.phone,
              contactType: (row.contactType as any) || 'GENERAL_OFFICE',
              isPrimary: true,
            },
            update: {
              firstName: row.firstName || undefined,
              lastName: row.lastName || undefined,
              title: row.title || undefined,
              phone: row.phone || undefined,
            },
          })
        }

        console.log(`✅ Imported: ${company.name}`)
      } else if (result.duplicate === 'exact') {
        duplicates++
        console.log(`⏭️  Skipped duplicate: ${result.company.name}`)
      } else {
        flagged++
        console.log(`🚩 Possible duplicate for "${row.name}" — flagged for review`)
        if (result.candidates[0]) {
          console.log(`   Candidate: ${result.candidates[0].name}`)
        }
      }
    } catch (err) {
      errors++
      console.error(`❌ Error on row ${i + 1}:`, (err as Error).message)
    }
  }

  console.log('\n📊 Summary:')
  console.log(`  ✅ Imported: ${imported}`)
  console.log(`  ⏭️  Duplicates skipped: ${duplicates}`)
  console.log(`  🚩 Flagged for review: ${flagged}`)
  console.log(`  ❌ Errors: ${errors}`)
  console.log(`  📈 Total processed: ${lines.length - 1}`)

  process.exit(0)
}

main()
