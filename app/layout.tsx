import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ADVAIT Scheduler',
  description: 'Daily task scheduler for ADVAIT studio',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
