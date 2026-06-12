'use client'

import { useState, useRef } from 'react'

export default function CSVUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setMessage('✗ Please upload a CSV file')
      return
    }

    setUploading(true)
    setMessage('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/import/csv', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setResult(data)
      setMessage(`✓ Import complete: ${data.imported} imported, ${data.duplicates} duplicates, ${data.flagged} flagged`)
    } catch (err) {
      setMessage('✗ Error: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-bold mb-4">Import Companies from CSV</h2>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="text-gray-600">
          <p className="text-lg font-semibold mb-1">
            {uploading ? 'Uploading...' : 'Drag & drop your CSV here'}
          </p>
          <p className="text-sm text-gray-500">or click to select a file</p>
          <p className="text-xs text-gray-500 mt-2">
            Required columns: Company, Website, Email, Phone (Contact Name optional)
          </p>
        </div>
      </div>

      {message && (
        <div className={`mt-4 p-4 rounded ${
          message.startsWith('✓')
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
          <h3 className="font-semibold mb-2">Import Summary</h3>
          <ul className="text-sm space-y-1">
            <li>✅ Imported: {result.imported}</li>
            <li>⏭️ Duplicates skipped: {result.duplicates}</li>
            <li>🚩 Flagged for review: {result.flagged}</li>
            {result.errors > 0 && <li>❌ Errors: {result.errors}</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
