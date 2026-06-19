export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Link from 'next/link'

interface DuplicateCandidate {
  newCompany: any
  potentialMatches: any[]
}

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b(llc|inc|pllc|pc|dds|pa|psc)\b/gi, '')
    .trim()
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }
  return dp[m][n]
}

function calculateSimilarity(a: string, b: string): number {
  const normA = normalizeCompanyName(a)
  const normB = normalizeCompanyName(b)
  const maxLen = Math.max(normA.length, normB.length)
  if (maxLen === 0) return 1
  const distance = levenshteinDistance(normA, normB)
  return 1 - distance / maxLen
}

'use client'

import { useState } from 'react'

async function deleteCompany(id: string) {
  const res = await fetch(`/api/companies/${id}/delete`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete company')
  return true
}

function DuplicatesContent({ initialCandidates }: { initialCandidates: DuplicateCandidate[] }) {
  const [duplicates, setDuplicates] = useState(initialCandidates)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (companyId: string, companyName: string) => {
    if (!confirm(`Delete "${companyName}"?`)) return

    setDeleting(companyId)
    try {
      await deleteCompany(companyId)
      setDuplicates(duplicates.filter(d => d.newCompany.id !== companyId))
    } catch (err) {
      alert('Error deleting company: ' + (err as Error).message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      {duplicates.length === 0 ? (
        <div className="p-6 bg-green-50 rounded border border-green-200">
          <p className="text-green-800">No potential duplicates found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {duplicates.map(({ newCompany, potentialMatches }) => (
            <div key={newCompany.id} className="p-4 bg-yellow-50 rounded border border-yellow-200">
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-2">New Company</h3>
                  <Link
                    href={`/companies/${newCompany.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {newCompany.name}
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">
                    {newCompany.city} • {newCompany.createdAt.toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{newCompany.source}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-yellow-900 mb-2">Potential Matches</h3>
                  <div className="space-y-2">
                    {potentialMatches.map((match) => {
                      const similarity = calculateSimilarity(newCompany.name, match.name)
                      return (
                        <div key={match.id} className="p-2 bg-white rounded border border-yellow-100">
                          <Link
                            href={`/companies/${match.id}`}
                            className="text-blue-600 hover:underline text-sm font-medium"
                          >
                            {match.name}
                          </Link>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-600">
                              {match.city} • {match.createdAt.toLocaleDateString()}
                            </span>
                            <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-800 rounded">
                              {(similarity * 100).toFixed(0)}% match
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-yellow-200">
                <Link
                  href={`/companies/${newCompany.id}`}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Review
                </Link>
                <button
                  onClick={() => handleDelete(newCompany.id, newCompany.name)}
                  disabled={deleting === newCompany.id}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting === newCompany.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

async function DuplicatesPage() {
  // Get all companies
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: 'desc' },
  })

  // Find potential duplicates
  const potentialDuplicates: DuplicateCandidate[] = []

  for (const company of companies) {
    const matches = companies
      .filter(c => c.id !== company.id && c.city === company.city)
      .filter(c => {
        const similarity = calculateSimilarity(company.name, c.name)
        return similarity > 0.75
      })
      .sort((a, b) => calculateSimilarity(company.name, b.name) - calculateSimilarity(company.name, a.name))
      .slice(0, 3)

    if (matches.length > 0) {
      potentialDuplicates.push({
        newCompany: company,
        potentialMatches: matches,
      })
    }
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Potential Duplicates</h1>
        <p className="text-gray-600">
          {potentialDuplicates.length} companies with potential matches
        </p>
      </div>

      <DuplicatesContent initialCandidates={potentialDuplicates} />
    </div>
  )
}
