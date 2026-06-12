import { NextRequest, NextResponse } from 'next/server'
import { upsertProspect } from '@/lib/leads'
import { prisma } from '@/lib/prisma'

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

function fuzzyMatchHeader(header: string, aliases: string[]): boolean {
  const normalized = header.toLowerCase().trim()
  return aliases.some(alias => normalized.includes(alias))
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV must have headers and at least one data row' },
        { status: 400 }
      )
    }

    // Parse headers
    const headers = parseCSVLine(lines[0])
    const HEADER_ALIASES: Record<string, string[]> = {
      name: ['company', 'company name', 'name'],
      website: ['website', 'url', 'web'],
      email: ['email', 'contact email', 'email address'],
      phone: ['phone', 'contact phone', 'phone number'],
      firstName: ['first name', 'firstname', 'first', 'contact name'],
    }

    const headerMap: Record<string, number | undefined> = {}
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      const index = headers.findIndex(h => fuzzyMatchHeader(h, aliases))
      if (index !== -1) {
        headerMap[field] = index
      }
    }

    // Import rows
    let imported = 0
    let duplicates = 0
    let flagged = 0
    let errors = 0

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const row: Record<string, string> = {}

      for (const [field, index] of Object.entries(headerMap)) {
        if (index !== undefined && values[index]) {
          row[field] = values[index]
        }
      }

      if (!row.name) continue

      try {
        const result = await upsertProspect({
          name: row.name,
          website: row.website,
          source: 'csv_import',
        })

        if (!result.duplicate) {
          imported++

          // Create contact if email provided
          if (row.email) {
            await prisma.contact.upsert({
              where: {
                companyId_email: {
                  companyId: result.company.id,
                  email: row.email,
                },
              },
              create: {
                companyId: result.company.id,
                email: row.email,
                firstName: row.firstName,
                contactType: 'GENERAL_OFFICE',
                isPrimary: true,
              },
              update: {},
            })
          }
        } else if (result.duplicate === 'exact') {
          duplicates++
        } else {
          flagged++
        }
      } catch (err) {
        errors++
        console.error(`Error on row ${i + 1}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      duplicates,
      flagged,
      errors,
      total: lines.length - 1,
    })
  } catch (err) {
    console.error('Import error:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
