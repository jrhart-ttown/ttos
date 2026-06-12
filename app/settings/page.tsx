'use client'

import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const [baseHitCampaign, setBaseHitCampaign] = useState('')
  const [whaleCampaign, setWhaleCampaign] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setBaseHitCampaign(data.INSTANTLY_CAMPAIGN_BASE_HIT || '')
        setWhaleCampaign(data.INSTANTLY_CAMPAIGN_WHALE || '')
        setWebhookSecret(data.INSTANTLY_WEBHOOK_SECRET || '')
      }
    } catch (err) {
      console.error('Failed to fetch settings', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          INSTANTLY_CAMPAIGN_BASE_HIT: baseHitCampaign,
          INSTANTLY_CAMPAIGN_WHALE: whaleCampaign,
          INSTANTLY_WEBHOOK_SECRET: webhookSecret,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to save settings')
      }

      setMessage('✓ Settings saved successfully')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('✗ Error saving settings: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="container"><p>Loading settings...</p></div>
  }

  return (
    <div className="container">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-2xl">
        <h2 className="text-xl font-bold mb-6">Instantly Integration</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Base Hit Campaign ID
            </label>
            <input
              type="text"
              value={baseHitCampaign}
              onChange={(e) => setBaseHitCampaign(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded"
              placeholder="e.g., 75256e0c-1f4d-4954-ba0a-734346043ffa"
            />
            <p className="text-xs text-gray-600 mt-1">
              Campaign for predictable recurring revenue prospects (dental, medical, professional offices)
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Whale Campaign ID
            </label>
            <input
              type="text"
              value={whaleCampaign}
              onChange={(e) => setWhaleCampaign(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded"
              placeholder="e.g., 966142e4-0a8e-4614-b73e-39ca7557ad7b"
            />
            <p className="text-xs text-gray-600 mt-1">
              Campaign for transformational accounts (large churches, retreat centers, campuses)
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Webhook Secret
            </label>
            <input
              type="text"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded font-mono text-sm"
              placeholder="Random string for webhook validation"
            />
            <p className="text-xs text-gray-600 mt-1">
              Webhook URL: <code className="bg-gray-100 px-2 py-1 rounded">
                /api/webhooks/instantly?secret=YOUR_SECRET
              </code>
            </p>
          </div>

          {message && (
            <div className={`p-3 rounded text-sm ${
              message.startsWith('✓')
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
