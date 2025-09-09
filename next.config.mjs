import { withPayload } from '@payloadcms/next/withPayload'

// Build allowed dev origins from environment variables
function buildAllowedDevOrigins() {
  const origins = []

  // Add main app URL (remove protocol)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, ''))
  } else {
    origins.push('localhost:3000')
  }

  // Add localhost ports from environment
  const localhostPorts = process.env.CORS_LOCALHOST_PORTS?.split(',') || [
    '3000',
    '3001',
    '3002',
    '3003',
  ]
  localhostPorts.forEach((port) => {
    origins.push(`localhost:${port.trim()}`)
  })

  // Add custom domains from environment
  const customDomains = process.env.CORS_CUSTOM_DOMAINS?.split(',') || ['local.ft.tc', 'ax.ft.tc']
  customDomains.forEach((domain) => {
    origins.push(domain.trim())
  })

  // Remove duplicates
  return [...new Set(origins)]
}

// Build CORS origins for headers
function buildCorsOrigins() {
  const origins = []

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

  return origins.join(',')
}

// Build CSP domains for Content Security Policy
function buildCspDomains() {
  const customDomains = process.env.CORS_CUSTOM_DOMAINS?.split(',') || ['local.ft.tc', 'ax.ft.tc']
  return customDomains.map((domain) => `https://${domain.trim()}`).join(' ')
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin requests from specified domains
  allowedDevOrigins: buildAllowedDevOrigins(),

  // CORS headers for API routes and CSP for admin
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: buildCorsOrigins(),
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type,Authorization,x-gupshup-signature',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' ${buildCspDomains()};
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob: https:;
              font-src 'self' data:;
              connect-src 'self' ${buildCspDomains()};
              frame-src 'self' ${buildCspDomains()};
            `
              .replace(/\s+/g, ' ')
              .trim(),
          },
        ],
      },
    ]
  },

  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
