import { describe, it, expect, beforeAll } from 'vitest'
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { WhatsAppService } from '@/lib/whatsapp/whatsapp-service'
import { VehicleProcessingService } from '@/lib/whatsapp/vehicle-processing-service'
import axios from 'axios'
import crypto from 'crypto-js'

let payload: Payload

describe('External Services Integration Tests', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  describe('Database Connection (MongoDB)', () => {
    it('should connect to MongoDB successfully', async () => {
      const users = await payload.find({
        collection: 'users',
        limit: 1,
      })
      expect(users).toBeDefined()
      expect(users.docs).toBeDefined()
    })

    it('should be able to create and delete test records', async () => {
      // Create a test user
      const testUser = await payload.create({
        collection: 'users',
        data: {
          email: 'test-external-services@example.com',
          password: 'testpassword123',
          role: 'customer',
          name: 'Test External Services User',
        },
      })

      expect(testUser).toBeDefined()
      expect(testUser.email).toBe('test-external-services@example.com')

      // Clean up - delete the test user
      await payload.delete({
        collection: 'users',
        id: testUser.id,
      })
    })
  })

  describe('Cloudflare R2 Storage (S3 Compatible)', () => {
    it('should have valid S3 configuration', () => {
      expect(process.env.S3_ENDPOINT).toBeDefined()
      expect(process.env.S3_REGION).toBeDefined()
      expect(process.env.S3_BUCKET).toBeDefined()
      expect(process.env.S3_ACCESS_KEY_ID).toBeDefined()
      expect(process.env.S3_SECRET_ACCESS_KEY).toBeDefined()
      expect(process.env.S3_PUBLIC_BUCKET).toBeDefined()
    })

    // Note: Network connectivity test moved to network-connectivity.int.spec.ts
    // to avoid CORS issues in jsdom environment

    it('should validate S3 public bucket URL format', () => {
      const publicBucket = process.env.S3_PUBLIC_BUCKET!
      expect(publicBucket).toMatch(/^https?:\/\//)
      expect(publicBucket).toBe('https://media.ft.tc')
    })
  })

  describe('WhatsApp Service (Gupshup)', () => {
    let whatsappService: WhatsAppService

    beforeAll(() => {
      whatsappService = new WhatsAppService()
    })

    it('should initialize WhatsApp service with valid configuration', () => {
      expect(process.env.GUPSHUP_API_KEY).toBeDefined()
      expect(process.env.GUPSHUP_APP_NAME).toBeDefined()
      expect(process.env.GUPSHUP_SOURCE_NUMBER).toBeDefined()
      expect(whatsappService).toBeDefined()
    })

    it('should validate phone number formatting', () => {
      const testNumbers = [
        { input: '0123456789', expected: '60123456789' },
        { input: '60123456789', expected: '60123456789' },
        { input: '+60123456789', expected: '60123456789' },
        { input: '012-345-6789', expected: '60123456789' },
      ]

      testNumbers.forEach(({ input, expected }) => {
        const formatted = whatsappService.formatPhoneNumber(input)
        expect(formatted).toBe(expected)
      })
    })

    it('should validate WhatsApp number format', () => {
      const validNumbers = ['60123456789', '601234567890']
      const invalidNumbers = ['123456789', '70123456789', '60123']

      validNumbers.forEach((number) => {
        expect(whatsappService.isValidWhatsAppNumber(number)).toBe(true)
      })

      invalidNumbers.forEach((number) => {
        expect(whatsappService.isValidWhatsAppNumber(number)).toBe(false)
      })
    })

    it('should generate WhatsApp links correctly', () => {
      const orderId = 'AX-20241206-0001'
      const link = whatsappService.generateWhatsAppLink(orderId)

      expect(link).toContain('https://wa.me/')
      expect(link).toContain(process.env.GUPSHUP_SOURCE_NUMBER)
      expect(link).toContain(encodeURIComponent(`Hi-Welcome-To-AX:OrderId-[${orderId}]`))
    })

    it('should extract order ID from message content', () => {
      const messageWithOrderId = 'Hi-Welcome-To-AX:OrderId-[AX-20241206-0001]'
      const messageWithoutOrderId = 'Hello, I need help'

      expect(whatsappService.extractOrderId(messageWithOrderId)).toBe('AX-20241206-0001')
      expect(whatsappService.extractOrderId(messageWithoutOrderId)).toBeNull()
    })

    it('should check 24-hour messaging window correctly', () => {
      const now = new Date()
      const within24Hours = new Date(now.getTime() - 23 * 60 * 60 * 1000) // 23 hours ago
      const beyond24Hours = new Date(now.getTime() - 25 * 60 * 60 * 1000) // 25 hours ago

      expect(whatsappService.isWithin24HourWindow(within24Hours)).toBe(true)
      expect(whatsappService.isWithin24HourWindow(beyond24Hours)).toBe(false)
    })

    it('should verify webhook signature correctly', () => {
      const payload = '{"test": "data"}'
      const secret = 'test-secret'
      const validSignature = crypto.HmacSHA256(payload, secret).toString()
      const invalidSignature = 'invalid-signature'

      // Mock the webhook secret for testing
      const originalSecret = process.env.GUPSHUP_WEBHOOK_SECRET
      process.env.GUPSHUP_WEBHOOK_SECRET = secret

      expect(whatsappService.verifyWebhookSignature(payload, validSignature)).toBe(true)
      expect(whatsappService.verifyWebhookSignature(payload, invalidSignature)).toBe(false)
      expect(whatsappService.verifyWebhookSignature(payload, null)).toBe(false) // No signature provided

      // Test with no secret configured - should skip verification
      delete process.env.GUPSHUP_WEBHOOK_SECRET
      expect(whatsappService.verifyWebhookSignature(payload, 'any-signature')).toBe(true) // No secret configured

      // Restore original secret
      if (originalSecret) {
        process.env.GUPSHUP_WEBHOOK_SECRET = originalSecret
      }
    })

    // Note: Actual API calls are commented out to avoid hitting rate limits during testing
    // Uncomment these tests when you want to test actual API connectivity
    /*
    it('should send test message via Gupshup API', async () => {
      const testNumber = process.env.GUPSHUP_TEST_CUSTOMER_NUMBER!
      const testMessage = 'Test message from AX Billing integration test'
      
      const result = await whatsappService.sendMessage(testNumber, testMessage)
      expect(result).toBe(true)
    }, 15000)
    */
  })

  describe('OpenRouter AI Service', () => {
    let vehicleProcessingService: VehicleProcessingService

    beforeAll(() => {
      vehicleProcessingService = new VehicleProcessingService()
    })

    it('should have valid OpenRouter configuration', () => {
      expect(process.env.OPENROUTER_API_KEY).toBeDefined()
      expect(process.env.OPENROUTER_API_KEY).toMatch(/^sk-or-v1-/)
    })

    it('should initialize vehicle processing service', () => {
      expect(vehicleProcessingService).toBeDefined()
    })

    // Note: Actual AI processing test is commented out to avoid API costs during testing
    // Uncomment this test when you want to test actual AI connectivity
    /*
    it('should process vehicle image with AI', async () => {
      // Use a test image URL (you would need to provide a valid image URL)
      const testImageUrl = 'https://example.com/test-car-image.jpg'
      
      const result = await vehicleProcessingService.processVehiclePhoto(testImageUrl)
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
    }, 30000)
    */
  })

  describe('Fiuu Payment Gateway', () => {
    it('should have valid Fiuu configuration', () => {
      expect(process.env.FIUU_MERCHANT_ID).toBeDefined()
      expect(process.env.FIUU_VERIFY_KEY).toBeDefined()
      expect(process.env.FIUU_SECRET_KEY).toBeDefined()
      expect(process.env.FIUU_SANDBOX).toBeDefined()

      expect(process.env.FIUU_MERCHANT_ID).toBe('axautoexpressca')
      expect(process.env.FIUU_SANDBOX).toBe('false')
    })

    it('should validate Fiuu configuration format', () => {
      const merchantId = process.env.FIUU_MERCHANT_ID!
      const verifyKey = process.env.FIUU_VERIFY_KEY!
      const secretKey = process.env.FIUU_SECRET_KEY!

      expect(merchantId).toMatch(/^[a-zA-Z0-9]+$/)
      expect(verifyKey).toHaveLength(32) // Fiuu keys are typically 32 characters
      expect(secretKey).toHaveLength(32)
    })

    // Note: Actual payment gateway tests would require implementing the Fiuu service
    // This is a placeholder for when the Fiuu integration is implemented
    /*
    it('should generate payment link', async () => {
      const fiuuService = new FiuuPaymentService()
      const paymentData = {
        orderId: 'AX-20241206-0001',
        amount: 25.00,
        customerEmail: 'test@example.com',
        customerPhone: '60123456789',
        description: 'Car wash service test'
      }
      
      const paymentLink = await fiuuService.generatePaymentLink(paymentData)
      expect(paymentLink).toMatch(/^https?:\/\//)
    })
    */
  })

  describe('Application Configuration', () => {
    it('should have valid application URLs', () => {
      expect(process.env.NEXT_PUBLIC_APP_URL).toBeDefined()
      expect(process.env.NEXT_PUBLIC_APP_URL).toMatch(/^https?:\/\//)
    })

    it('should have valid Payload secret', () => {
      expect(process.env.PAYLOAD_SECRET).toBeDefined()
      expect(process.env.PAYLOAD_SECRET).toHaveLength(24) // Payload secrets are typically 24 characters
    })
  })
})
