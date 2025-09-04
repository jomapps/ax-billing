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
      <body className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white antialiased">
        <div className="grid-bg min-h-screen">
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
