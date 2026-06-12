import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TTOS - Lead Management',
  description: 'T-Town Pristine Clean Lead Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
