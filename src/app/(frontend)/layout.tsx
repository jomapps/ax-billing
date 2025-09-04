import React from 'react'
import { Inter, Orbitron } from 'next/font/google'

import './styles.css'
import '../../styles/gaming-theme.css'

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
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
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
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
