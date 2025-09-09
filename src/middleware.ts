import { NextRequest, NextResponse } from 'next/server'

// Build allowed origins from environment variables
function buildAllowedOrigins(): string[] {
  const origins: string[] = []

  // Add main app URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL)
  } else {
    origins.push('http://localhost:3000')
  }

  // Add localhost ports from environment
  const localhostPorts = process.env.CORS_LOCALHOST_PORTS?.split(',') || [
    '3000',
    '3001',
    '3002',
    '3003',
  ]
  localhostPorts.forEach((port) => {
    origins.push(`http://localhost:${port.trim()}`)
    origins.push(`https://localhost:${port.trim()}`)
  })

  // Add custom domains from environment
  const customDomains = process.env.CORS_CUSTOM_DOMAINS?.split(',') || ['local.ft.tc', 'ax.ft.tc']
  customDomains.forEach((domain) => {
    origins.push(`https://${domain.trim()}`)
    origins.push(`http://${domain.trim()}`)
  })

  // Remove duplicates
  return [...new Set(origins)]
}

const allowedOrigins = buildAllowedOrigins()

export function middleware(request: NextRequest) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 })

      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
      }

      response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type,Authorization,x-gupshup-signature',
      )
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Access-Control-Max-Age', '86400')

      return response
    }

    // Handle actual requests
    const response = NextResponse.next()

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type,Authorization,x-gupshup-signature',
    )
    response.headers.set('Access-Control-Allow-Credentials', 'true')

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
