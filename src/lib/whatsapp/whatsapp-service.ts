import axios from 'axios'
import crypto from 'crypto-js'

export interface WhatsAppMessage {
  to: string
  message: string
  type?: 'text' | 'template' | 'media'
  templateId?: string
  variables?: Record<string, string>
  mediaUrl?: string
  caption?: string
}

export interface GupshupWebhookData {
  type: string
  payload: {
    id: string
    mobile: string
    text?: string
    name?: string
    timestamp: string
    type: string
  }
}

export class WhatsAppService {
  private apiKey: string
  private appName: string
  private sourceNumber: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.GUPSHUP_API_KEY!
    this.appName = process.env.GUPSHUP_APP_NAME!
    this.sourceNumber = process.env.GUPSHUP_SOURCE_NUMBER!
    this.baseUrl = 'https://api.gupshup.io/sm/api/v1'

    if (!this.apiKey || !this.appName || !this.sourceNumber) {
      throw new Error('Missing required Gupshup configuration')
    }
  }

  /**
   * Send a text message via WhatsApp
   */
  async sendMessage(to: string, message: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/msg`,
        {
          channel: 'whatsapp',
          source: this.sourceNumber,
          destination: to,
          message: {
            type: 'text',
            text: message,
          },
          'src.name': this.appName,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: this.apiKey,
          },
        }
      )

      return response.data.status === 'submitted'
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error)
      return false
    }
  }

  /**
   * Send a template message via WhatsApp
   */
  async sendTemplate(
    to: string,
    templateId: string,
    variables: Record<string, string> = {}
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/msg`,
        {
          channel: 'whatsapp',
          source: this.sourceNumber,
          destination: to,
          template: {
            id: templateId,
            params: Object.values(variables),
          },
          'src.name': this.appName,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: this.apiKey,
          },
        }
      )

      return response.data.status === 'submitted'
    } catch (error) {
      console.error('Failed to send WhatsApp template:', error)
      return false
    }
  }

  /**
   * Send a media message via WhatsApp
   */
  async sendMedia(to: string, mediaUrl: string, caption?: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/msg`,
        {
          channel: 'whatsapp',
          source: this.sourceNumber,
          destination: to,
          message: {
            type: 'image',
            originalUrl: mediaUrl,
            previewUrl: mediaUrl,
            caption: caption || '',
          },
          'src.name': this.appName,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: this.apiKey,
          },
        }
      )

      return response.data.status === 'submitted'
    } catch (error) {
      console.error('Failed to send WhatsApp media:', error)
      return false
    }
  }

  /**
   * Verify webhook signature from Gupshup
   */
  verifyWebhookSignature(payload: string, signature: string | null): boolean {
    if (!signature) return false

    const webhookSecret = process.env.GUPSHUP_WEBHOOK_SECRET
    if (!webhookSecret) return true // Skip verification if no secret configured

    const expectedSignature = crypto.HmacSHA256(payload, webhookSecret).toString()
    return signature === expectedSignature
  }

  /**
   * Extract order ID from WhatsApp message content
   */
  extractOrderId(messageContent: string): string | null {
    // Look for pattern: Hi-Welcome-To-AX:OrderId-[AX-YYYYMMDD-XXXX]
    const orderIdPattern = /OrderId-\[(AX-\d{8}-\d{4})\]/
    const match = messageContent.match(orderIdPattern)
    return match ? match[1] : null
  }

  /**
   * Generate WhatsApp link with order ID
   */
  generateWhatsAppLink(orderId: string, customMessage?: string): string {
    const baseMessage = customMessage || `Hi-Welcome-To-AX:OrderId-[${orderId}]`
    const encodedMessage = encodeURIComponent(baseMessage)
    return `https://wa.me/${this.sourceNumber}?text=${encodedMessage}`
  }

  /**
   * Generate basic WhatsApp link without order ID
   */
  generateBasicWhatsAppLink(): string {
    const message = 'Hi AX Billing, I need car wash service'
    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${this.sourceNumber}?text=${encodedMessage}`
  }

  /**
   * Check if we're within the 24-hour messaging window
   */
  isWithin24HourWindow(lastContactTime: Date): boolean {
    const now = new Date()
    const timeDiff = now.getTime() - lastContactTime.getTime()
    const hoursDiff = timeDiff / (1000 * 60 * 60)
    return hoursDiff <= 24
  }

  /**
   * Format phone number for WhatsApp
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '')
    
    // Add country code if not present (assuming Malaysia +60)
    if (!cleaned.startsWith('60') && cleaned.length === 10) {
      cleaned = '60' + cleaned.substring(1) // Remove leading 0 and add 60
    }
    
    return cleaned
  }

  /**
   * Validate WhatsApp number format
   */
  isValidWhatsAppNumber(phoneNumber: string): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber)
    // Malaysian numbers should be 11-12 digits starting with 60
    return /^60\d{9,10}$/.test(formatted)
  }
}
