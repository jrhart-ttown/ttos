'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ResearchDashboard({ industries }: { industries: Record<string, any> }) {
  const [zipCode, setZipCode] = useState('')
  const [researching, setResearching] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [stats, setStats] = useState<Record<string, any>>({})
  const [progress, setProgress] = useState<Record<string, any>>({})
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    // Load industry stats and research progress
    const loadStats = async () => {
      try {
        const statsResult: Record<string, any> = {}
        const progressResult: Record<string, any> = {}
        for (const key of Object.keys(industries)) {
          const res = await fetch(`/api/research/stats?industryKey=${key}`)
          const data = await res.json()
          statsResult[key] = data

          // Load research progress
          const progRes = await fetch(`/api/research/progress?industryKey=${key}`)
          const progData = await progRes.json()
          progressResult[key] = progData
        }
        setStats(statsResult)
        setProgress(progressResult)
      } catch (err) {
        console.error('Error loading stats:', err)
      }
    }
    loadStats()
  }, [industries])

  const handleStartResearch = async (industryKey: string) => {
    // In advanced mode, require ZIP code; otherwise auto-select territory
    if (showAdvanced && !zipCode) {
      setError('Please enter a zip code for manual research')
      return
    }

    setResearching(industryKey)
    setError('')
    setResult(null)

    try {
      const body: any = { industryKey }
      if (showAdvanced && zipCode) {
        body.zipCode = zipCode
      }

      const res = await fetch('/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

      // Refresh stats and progress
      const statsRes = await fetch(`/api/research/stats?industryKey=${industryKey}`)
      const updatedStats = await statsRes.json()
      setStats((prev) => ({ ...prev, [industryKey]: updatedStats }))

      const progRes = await fetch(`/api/research/progress?industryKey=${industryKey}`)
      const updatedProg = await progRes.json()
      setProgress((prev) => ({ ...prev, [industryKey]: updatedProg }))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setResearching(null)
    }
  }

  const getIndustryColor = (key: string) => {
    const whaleIndustries = ['industrial', 'retreat', 'education']
    return whaleIndustries.includes(key) ? 'bg-blue-soft border-blue-300' : 'bg-blue-soft border-blue-300'
  }

  return (
    <div className="space-y-8">
      {/* Active Research Result */}
      {result && (
        <div style={{ background: '#EAF2FD', borderColor: '#1E7BE8' }} className="border-2 rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold" style={{ color: '#0B1F3A' }}>
              ✓ Research Complete: {result.industryName}
            </h2>
            {result.territoryKey && (
              <p className="text-sm mt-1" style={{ color: '#1E7BE8' }}>
                Territory: <strong>{result.territoryKey.replace(/_/g, ' ')}</strong> · ZIP codes: {result.zipCodes?.join(', ')}
              </p>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded border" style={{ borderColor: '#1E7BE8' }}>
              <div className="text-3xl font-bold" style={{ color: '#1E7BE8' }}>{result.imported}</div>
              <div className="text-sm" style={{ color: '#566578' }}>New prospects</div>
            </div>
            <div className="bg-white p-4 rounded border" style={{ borderColor: '#E4EAF2' }}>
              <div className="text-3xl font-bold" style={{ color: '#0E1B2C' }}>{result.duplicates}</div>
              <div className="text-sm" style={{ color: '#566578' }}>Duplicates skipped</div>
            </div>
            <div className="bg-white p-4 rounded border" style={{ borderColor: '#E4EAF2' }}>
              <div className="text-3xl font-bold" style={{ color: '#0E1B2C' }}>{result.total}</div>
              <div className="text-sm" style={{ color: '#566578' }}>Found in research</div>
            </div>
            <div className="bg-white p-4 rounded border" style={{ borderColor: '#E4EAF2' }}>
              <div className="text-3xl font-bold" style={{ color: '#1E7BE8' }}>{stats[result.industryKey]?.remaining || 0}</div>
              <div className="text-sm" style={{ color: '#566578' }}>Ready to contact</div>
            </div>
          </div>
          <div className="flex gap-4">
            <Link
              href="/pipeline"
              className="px-6 py-2 text-white rounded font-medium"
              style={{ background: '#1E7BE8' }}
            >
              View in Pipeline
            </Link>
            <Link
              href="/today"
              className="px-6 py-2 text-white rounded font-medium"
              style={{ background: '#0B1F3A' }}
            >
              Start Today's Outreach
            </Link>
            <button
              onClick={() => setResult(null)}
              className="px-6 py-2 rounded font-medium"
              style={{ background: '#F4F8FD', color: '#0B1F3A', border: '1px solid #E4EAF2' }}
            >
              Research Another
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="border-2 rounded-lg p-6" style={{ background: '#FFE8E6', borderColor: '#DC2626', color: '#991B1B' }}>
          <h3 className="font-bold mb-2">❌ Research error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Advanced ZIP Code Override */}
      {!result && (
        <div className="border rounded-lg p-6" style={{ background: '#F4F8FD', borderColor: '#E4EAF2' }}>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm font-semibold flex items-center gap-2"
            style={{ color: '#1E7BE8' }}
          >
            {showAdvanced ? '▼' : '▶'} Advanced: Manual Territory Override
          </button>
          {showAdvanced && (
            <div className="mt-4 space-y-3 pt-4" style={{ borderTop: '1px solid #E4EAF2' }}>
              <p className="text-xs" style={{ color: '#566578' }}>
                By default, TTOS selects the next unresearched territory per industry. Use this to manually specify a ZIP code.
              </p>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="e.g., 74103 (Tulsa), 74008 (Broken Arrow)"
                className="w-full px-4 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#E4EAF2', color: '#0E1B2C' }}
                disabled={researching !== null}
              />
            </div>
          )}
        </div>
      )}

      {/* Industry Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold" style={{ color: '#0B1F3A' }}>Territory-Based Research</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(industries).map(([key, industry]) => {
            const industryStats = stats[key]
            const industryProgress = progress[key]
            const isWhale = (industry as any).whale

            let bgColor = '#EAF2FD'
            let borderColor = '#1E7BE8'
            if (researching === key) {
              bgColor = '#EAF2FD'
              borderColor = '#1E7BE8'
            } else if (result) {
              bgColor = '#F4F8FD'
              borderColor = '#E4EAF2'
            }

            return (
              <div
                key={key}
                className="p-6 rounded-lg border-2 transition"
                style={{ background: bgColor, borderColor: borderColor }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: '#0B1F3A' }}>
                      {(industry as any).name} {isWhale && '🐋'}
                    </h3>
                    <p className="text-xs mt-1" style={{ color: '#566578' }}>
                      {(industry as any).searchTerm}
                    </p>
                  </div>
                  {researching === key && (
                    <div className="font-bold text-2xl" style={{ color: '#1E7BE8' }}>⏳</div>
                  )}
                </div>

                {/* Territory Progress */}
                {industryProgress && (
                  <div className="mb-4 pt-3" style={{ borderTop: '1px solid #E4EAF2' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#0B1F3A' }}>
                      Territory Progress: {industryProgress.completed}/{industryProgress.total}
                    </p>
                    <div className="w-full rounded-full h-2 mb-2" style={{ background: '#E4EAF2' }}>
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${(industryProgress.completed / industryProgress.total) * 100}%`,
                          background: '#1E7BE8',
                        }}
                      ></div>
                    </div>
                    {industryProgress.nextTerritory && (
                      <p className="text-xs" style={{ color: '#0B1F3A' }}>
                        Next: <strong>{industryProgress.nextTerritory.name}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Prospect Stats */}
                {industryStats && (
                  <div className="pt-3 mb-4" style={{ borderTop: '1px solid #E4EAF2' }}>
                    <p className="text-xs" style={{ color: '#0B1F3A' }}>
                      <strong>{industryStats.total}</strong> prospects · <strong>{industryStats.remaining}</strong> ready to contact
                    </p>
                    <div className="w-full rounded-full h-2 mt-2" style={{ background: '#E4EAF2' }}>
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${industryStats.percentComplete}%`,
                          background: '#1E7BE8',
                        }}
                      ></div>
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#566578' }}>{industryStats.percentComplete}% contacted</p>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleStartResearch(key)}
                  disabled={researching === key || !!result}
                  className="w-full py-2 px-4 rounded font-semibold transition"
                  style={{
                    background: researching === key || result ? '#F4F8FD' : '#1E7BE8',
                    color: researching === key || result ? '#566578' : '#fff',
                    border: researching === key || result ? '1px solid #E4EAF2' : 'none',
                    cursor: researching === key || result ? 'not-allowed' : 'pointer',
                    opacity: result ? 0.5 : 1,
                  }}
                >
                  {researching === key ? 'Researching...' : 'Find Next Companies'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="border rounded-lg p-6" style={{ background: '#EAF2FD', borderColor: '#1E7BE8' }}>
        <h3 className="font-bold mb-2" style={{ color: '#0B1F3A' }}>🎯 How TTOS Works</h3>
        <ol className="text-sm space-y-1 ml-4 list-decimal" style={{ color: '#0B1F3A' }}>
          <li>Pick an industry</li>
          <li>Click "Find Next Companies" — TTOS automatically selects the next unresearched territory</li>
          <li>Prospects are scraped, deduplicated, and imported to Pipeline</li>
          <li>Track territory coverage progress for each industry</li>
          <li>Use "Advanced: Manual Territory Override" to research specific ZIP codes</li>
          <li>Once all territories are covered, the cycle repeats</li>
          <li>🐋 = High-value whale opportunities (multi-location, event venues, etc.)</li>
        </ol>
      </div>
    </div>
  )
}
