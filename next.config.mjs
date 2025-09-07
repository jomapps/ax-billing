import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin requests from specified domains
  allowedDevOrigins: [
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || 'localhost:3000',
    'localhost:3001',
    'localhost:3002',
    'localhost:3003',
    'local.ft.tc',
    'ax.ft.tc',
  ],

  // CORS headers for API routes and CSP for admin
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'},localhost:3001,localhost:3002,localhost:3003,https://local.ft.tc,https://ax.ft.tc`,
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
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://local.ft.tc https://ax.ft.tc;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob: https:;
              font-src 'self' data:;
              connect-src 'self' https://local.ft.tc https://ax.ft.tc;
              frame-src 'self' https://local.ft.tc https://ax.ft.tc;
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
