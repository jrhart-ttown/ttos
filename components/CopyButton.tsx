'use client'

import { useState } from 'react'

interface CopyButtonProps {
  value: string
  label?: string
  className?: string
}

export default function CopyButton({ value, label = '📋', className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={`Copy ${value}`}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
        copied
          ? 'bg-green-100 text-green-700 font-semibold'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      } ${className}`}
    >
      {copied ? '✓ Copied!' : label}
    </button>
  )
}
