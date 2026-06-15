'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ResearchDashboard({ industries }: { industries: Record<string, any> }) {
  const [researching, setResearching] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [stats, setStats] = useState<Record<string, any>>({})

  useEffect(() => {
    // Load industry stats
    const loadStats = async () => {
      try {
        const statsResult: Record<string, any> = {}
        for (const key of Object.keys(industries)) {
          const res = await fetch(`/api/research/stats?industryKey=${key}`)
          const data = await res.json()
          statsResult[key] = data
        }
        setStats(statsResult)
      } catch (err) {
        console.error('Error loading stats:', err)
      }
    }
    loadStats()
  }, [industries])

  const handleStartResearch = async (industryKey: string) => {
    setResearching(industryKey)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industryKey }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Research failed')
      }

      setResult({
        ...data,
        industryKey,
        industryName: industries[industryKey].name,
      })

      // Refresh stats
      const statsRes = await fetch(`/api/research/stats?industryKey=${industryKey}`)
      const updatedStats = await statsRes.json()
      setStats((prev) => ({ ...prev, [industryKey]: updatedStats }))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setResearching(null)
    }
  }

  const getIndustryColor = (key: string) => {
    const whaleIndustries = ['industrial', 'retreat', 'education']
    return whaleIndustries.includes(key) ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'
  }

  return (
    <div className="space-y-8">
      {/* Active Research Result */}
      {result && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-green-900 mb-4">
            ✓ Research Complete: {result.industryName}
          </h2>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded border border-green-200">
              <div className="text-3xl font-bold text-green-700">{result.imported}</div>
              <div className="text-sm text-gray-600">New prospects</div>
            </div>
            <div className="bg-white p-4 rounded border border-gray-200">
              <div className="text-3xl font-bold text-gray-700">{result.duplicates}</div>
              <div className="text-sm text-gray-600">Duplicates skipped</div>
            </div>
            <div className="bg-white p-4 rounded border border-gray-200">
              <div className="text-3xl font-bold text-gray-700">{result.total}</div>
              <div className="text-sm text-gray-600">Total in metro</div>
            </div>
            <div className="bg-white p-4 rounded border border-gray-200">
              <div className="text-3xl font-bold text-blue-700">{stats[result.industryKey]?.remaining || 0}</div>
              <div className="text-sm text-gray-600">Ready to contact</div>
            </div>
          </div>
          <div className="flex gap-4">
            <Link
              href="/pipeline"
              className="px-6 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700"
            >
              View in Pipeline
            </Link>
            <Link
              href="/today"
              className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
            >
              Start Today's Outreach
            </Link>
            <button
              onClick={() => setResult(null)}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded font-medium hover:bg-gray-400"
            >
              Research Another
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-red-900">
          <h3 className="font-bold mb-2">❌ Research error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Industry Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Available Industries</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(industries).map(([key, industry]) => {
            const industryStats = stats[key]
            const isWhale = (industry as any).whale

            return (
              <button
                key={key}
                onClick={() => handleStartResearch(key)}
                disabled={researching === key || !!result}
                className={`p-6 rounded-lg border-2 transition text-left ${
                  researching === key
                    ? 'bg-blue-50 border-blue-300'
                    : result
                    ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                    : getIndustryColor(key) + ' border-gray-200 hover:border-blue-400 cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {(industry as any).name} {isWhale && '🐋'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {(industry as any).searchTerm}
                    </p>
                    {industryStats && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-700">
                          <strong>{industryStats.total}</strong> total · <strong>{industryStats.remaining}</strong> ready
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${industryStats.percentComplete}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{industryStats.percentComplete}% contacted</p>
                      </div>
                    )}
                  </div>
                  {researching === key && (
                    <div className="text-blue-600 font-bold text-lg">⏳</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-2">📋 Workflow</h3>
        <ol className="text-sm text-blue-900 space-y-1 ml-4 list-decimal">
          <li>Select an industry to research all prospects in Tulsa metro</li>
          <li>TTOS automatically identifies and deduplicates prospects</li>
          <li>View in Pipeline or jump to Today's Outreach</li>
          <li>20-25 new prospects surface each day automatically</li>
          <li>Get warning at 85% to switch to next industry</li>
          <li>🐋 = High-value whale opportunities (multi-location, event venues, etc.)</li>
        </ol>
      </div>
    </div>
  )
}
