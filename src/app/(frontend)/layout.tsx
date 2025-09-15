import React from 'react'
import { Inter, Orbitron } from 'next/font/google'

import './styles.css'
import '../../styles/gaming-theme.css'
import { SyncManagerProvider } from '@/lib/sync'
import SyncErrorBoundary from '@/components/common/SyncErrorBoundary'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
})

export const metadata = {
  title: 'AX Billing - Carwash Management System',
  description: 'Modern carwash management system with AI-powered vehicle classification',
  keywords: 'carwash, management, AI, vehicle, classification, billing',
  authors: [{ name: 'AX Billing Team' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
      <body
        className="min-h-screen text-white antialiased"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'Inter, Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        <div className="grid-bg min-h-screen">
          <main>
            <SyncManagerProvider
              initialConfig={{ autoConnect: true, autoReconnect: true }}
              enablePersistence={true}
            >
              <SyncErrorBoundary>{children}</SyncErrorBoundary>
            </SyncManagerProvider>
          </main>
        </div>
      </body>
    </html>
  )
}
