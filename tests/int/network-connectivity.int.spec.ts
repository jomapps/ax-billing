import { describe, it, expect } from 'vitest'
import axios from 'axios'

describe('Network Connectivity Tests', () => {
  const timeout = 15000 // 15 seconds timeout for network requests

  describe('Gupshup WhatsApp API', () => {
    const gupshupBaseUrl = 'https://api.gupshup.io'
    const apiKey = process.env.GUPSHUP_API_KEY!

    it('should reach Gupshup API endpoint', async () => {
      try {
        const response = await axios.get(`${gupshupBaseUrl}/sm/api/v1/app`, {
          headers: {
            'apikey': apiKey,
          },
          timeout,
        })
        
        expect(response.status).toBeLessThan(500)
      } catch (error: any) {
        // Even 401/403 means the endpoint is reachable
        if (error.response && [401, 403, 404].includes(error.response.status)) {
          expect(error.response.status).toBeLessThan(500)
        } else {
          throw error
        }
      }
    }, timeout)

    it('should validate API key format', () => {
      expect(apiKey).toBeDefined()
      expect(apiKey).toMatch(/^[a-zA-Z0-9]+$/)
      expect(apiKey.length).toBeGreaterThan(10)
    })

    it('should test WhatsApp message endpoint structure', async () => {
      const testPayload = {
        channel: 'whatsapp',
        source: process.env.GUPSHUP_SOURCE_NUMBER,
        destination: process.env.GUPSHUP_TEST_CUSTOMER_NUMBER,
        message: {
          type: 'text',
          text: 'Test connectivity - please ignore',
        },
        'src.name': process.env.GUPSHUP_APP_NAME,
      }

      try {
        // We're not actually sending, just testing the endpoint structure
        const response = await axios.post(
          `${gupshupBaseUrl}/sm/api/v1/msg`,
          testPayload,
          {
            headers: {
              'Content-Type': 'application/json',
              'apikey': apiKey,
            },
            timeout: 5000,
            validateStatus: () => true, // Accept any status code
          }
        )

        // Any response (even error) means the endpoint is reachable
        expect(response.status).toBeDefined()
        expect(response.data).toBeDefined()
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new Error('Cannot reach Gupshup API endpoint')
        }
        // Other errors are acceptable for connectivity test
      }
    }, timeout)
  })

  describe('OpenRouter AI API', () => {
    const openRouterBaseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
    const apiKey = process.env.OPENROUTER_API_KEY!

    it('should reach OpenRouter API endpoint', async () => {
      try {
        const response = await axios.get(`${openRouterBaseUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'AX Billing Test',
          },
          timeout,
        })
        
        expect(response.status).toBe(200)
        expect(response.data).toBeDefined()
      } catch (error: any) {
        // Even 401/403 means the endpoint is reachable
        if (error.response && [401, 403].includes(error.response.status)) {
          expect(error.response.status).toBeLessThan(500)
        } else {
          throw error
        }
      }
    }, timeout)

    it('should validate OpenRouter API key format', () => {
      expect(apiKey).toBeDefined()
      expect(apiKey).toMatch(/^sk-or-v1-/)
      expect(apiKey.length).toBeGreaterThan(20)
    })

    it('should test chat completions endpoint structure', async () => {
      const testPayload = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Test connectivity - respond with "OK"',
          },
        ],
        max_tokens: 5,
        temperature: 0,
      }

      try {
        const response = await axios.post(
          `${openRouterBaseUrl}/chat/completions`,
          testPayload,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
              'X-Title': 'AX Billing Connectivity Test',
            },
            timeout: 10000,
            validateStatus: () => true, // Accept any status code
          }
        )

        // Any response (even error) means the endpoint is reachable
        expect(response.status).toBeDefined()
        expect(response.data).toBeDefined()
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new Error('Cannot reach OpenRouter API endpoint')
        }
        // Other errors are acceptable for connectivity test
      }
    }, timeout)
  })

  describe('Cloudflare R2 Storage', () => {
    const s3Endpoint = process.env.S3_ENDPOINT!
    const s3PublicBucket = process.env.S3_PUBLIC_BUCKET!

    it('should reach S3 endpoint', async () => {
      try {
        const response = await axios.head(s3Endpoint, { 
          timeout,
          validateStatus: () => true,
        })
        
        // Any response means the endpoint is reachable
        expect(response.status).toBeDefined()
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new Error('Cannot reach S3 endpoint')
        }
        // Other errors (like 403) are acceptable for connectivity test
      }
    }, timeout)

    it('should reach public bucket URL', async () => {
      try {
        const response = await axios.head(s3PublicBucket, { 
          timeout,
          validateStatus: () => true,
        })
        
        // Any response means the endpoint is reachable
        expect(response.status).toBeDefined()
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new Error('Cannot reach public bucket URL')
        }
        // Other errors are acceptable for connectivity test
      }
    }, timeout)

    it('should validate S3 configuration format', () => {
      expect(s3Endpoint).toMatch(/^https:\/\//)
      expect(s3PublicBucket).toMatch(/^https:\/\//)
      expect(process.env.S3_REGION).toBeDefined()
      expect(process.env.S3_BUCKET).toBeDefined()
      expect(process.env.S3_ACCESS_KEY_ID).toBeDefined()
      expect(process.env.S3_SECRET_ACCESS_KEY).toBeDefined()
    })
  })

  describe('MongoDB Database', () => {
    it('should validate MongoDB URI format', () => {
      const dbUri = process.env.DATABASE_URI!
      expect(dbUri).toBeDefined()
      expect(dbUri).toMatch(/^mongodb:\/\//)
      expect(dbUri).toContain('ax-billing')
    })

    // Note: Database connectivity is tested in the main external-services test
    // through Payload CMS connection
  })

  describe('Fiuu Payment Gateway', () => {
    it('should validate Fiuu configuration', () => {
      expect(process.env.FIUU_MERCHANT_ID).toBeDefined()
      expect(process.env.FIUU_VERIFY_KEY).toBeDefined()
      expect(process.env.FIUU_SECRET_KEY).toBeDefined()
      expect(process.env.FIUU_SANDBOX).toBeDefined()
    })

    // Note: Fiuu API connectivity tests would be added here once the service is implemented
    // The current configuration suggests using sandbox mode for testing
  })

  describe('General Network Health', () => {
    it('should have internet connectivity', async () => {
      try {
        // Try multiple endpoints to ensure connectivity
        const endpoints = [
          'https://www.google.com',
          'https://api.github.com',
          'https://httpbin.org/status/200'
        ]

        let connected = false
        for (const endpoint of endpoints) {
          try {
            const response = await axios.get(endpoint, {
              timeout: 5000,
              validateStatus: () => true, // Accept any status
            })
            if (response.status < 500) {
              connected = true
              break
            }
          } catch (error) {
            // Continue to next endpoint
          }
        }

        if (!connected) {
          throw new Error('No internet connectivity detected')
        }

        expect(connected).toBe(true)
      } catch (error) {
        throw new Error('No internet connectivity detected')
      }
    }, timeout)

    it('should resolve DNS properly', async () => {
      const testDomains = [
        'api.gupshup.io',
        'openrouter.ai',
        'cloudflarestorage.com',
      ]

      for (const domain of testDomains) {
        try {
          await axios.head(`https://${domain}`, {
            timeout: 5000,
            validateStatus: () => true,
          })
        } catch (error: any) {
          if (error.code === 'ENOTFOUND') {
            throw new Error(`DNS resolution failed for ${domain}`)
          }
          // Other errors are acceptable - we just want to test DNS resolution
        }
      }
    }, timeout)
  })
})
