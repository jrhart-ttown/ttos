'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Header() {
  const router = useRouter()

  return (
    <header className="bg-gray-800 text-white sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            ← Back
          </button>
          <Link href="/" className="font-bold text-lg">
            TTOS
          </Link>
        </div>

        <nav className="flex gap-4 text-sm">
          <Link
            href="/pipeline"
            className="px-3 py-1 hover:bg-gray-700 rounded"
          >
            Pipeline
          </Link>
          <Link
            href="/approval-queue"
            className="px-3 py-1 hover:bg-gray-700 rounded"
          >
            Approvals
          </Link>
          <Link
            href="/audit"
            className="px-3 py-1 hover:bg-gray-700 rounded"
          >
            Audit
          </Link>
          <Link
            href="/settings"
            className="px-3 py-1 hover:bg-gray-700 rounded"
          >
            Settings
          </Link>
        </nav>
      </div>
    </header>
  )
}
