import { getPayload } from 'payload'
import config from '@/payload.config'
import { WhatsAppService } from './whatsapp-service'

export interface QRTrackingData {
  orderId: string
  staffId?: string
  location?: string
  generatedAt: Date
  scannedAt?: Date
  isScanned: boolean
}

export class QRCodeService {
  private whatsappService: WhatsAppService

  constructor() {
    this.whatsappService = new WhatsAppService()
  }

  /**
   * Generate WhatsApp link with order ID for QR code
   */
  generateWhatsAppLinkWithOrder(orderId: string, customMessage?: string): string {
    return this.whatsappService.generateWhatsAppLink(orderId, customMessage)
  }

  /**
   * Generate basic WhatsApp link without order ID
   */
  generateWhatsAppLink(): string {
    return this.whatsappService.generateBasicWhatsAppLink()
  }

  /**
   * Track QR code generation in the database
   */
  async trackQRGeneration(orderId: string, staffId?: string, location?: string): Promise<void> {
    try {
      const payload = await getPayload({ config })

      // Update the order to mark QR code as generated
      const orderResult = await payload.find({
        collection: 'orders',
        where: {
          orderID: {
            equals: orderId,
          },
        },
        limit: 1,
      })

      if (orderResult.docs.length > 0) {
        const order = orderResult.docs[0]
        await payload.update({
          collection: 'orders',
          id: order.id,
          data: {
            qrCodeGenerated: true,
            // Store metadata about QR generation
            metadata: {
              ...order.metadata,
              qrGeneration: {
                staffId,
                location,
                generatedAt: new Date(),
              },
            },
          },
        })
      }
    } catch (error) {
      console.error('Error tracking QR generation:', error)
    }
  }

  /**
   * Track QR code scan when customer sends message
   */
  async trackQRScan(orderId: string, whatsappNumber: string): Promise<void> {
    try {
      const payload = await getPayload({ config })

      // Update the order to mark QR code as scanned
      const orderResult = await payload.find({
        collection: 'orders',
        where: {
          orderID: {
            equals: orderId,
          },
        },
        limit: 1,
      })

      if (orderResult.docs.length > 0) {
        const order = orderResult.docs[0]
        await payload.update({
          collection: 'orders',
          id: order.id,
          data: {
            qrCodeScannedAt: new Date(),
            // Update metadata
            metadata: {
              ...order.metadata,
              qrScan: {
                scannedAt: new Date(),
                whatsappNumber,
              },
            },
          },
        })
      }
    } catch (error) {
      console.error('Error tracking QR scan:', error)
    }
  }

  /**
   * Get QR code analytics for a specific order
   */
  async getQRAnalytics(orderId: string): Promise<QRTrackingData | null> {
    try {
      const payload = await getPayload({ config })

      const orderResult = await payload.find({
        collection: 'orders',
        where: {
          orderID: {
            equals: orderId,
          },
        },
        limit: 1,
      })

      if (orderResult.docs.length === 0) {
        return null
      }

      const order = orderResult.docs[0]
      const metadata = order.metadata || {}

      return {
        orderId,
        staffId: metadata.qrGeneration?.staffId,
        location: metadata.qrGeneration?.location,
        generatedAt: metadata.qrGeneration?.generatedAt || order.createdAt,
        scannedAt: order.qrCodeScannedAt,
        isScanned: !!order.qrCodeScannedAt,
      }
    } catch (error) {
      console.error('Error getting QR analytics:', error)
      return null
    }
  }

  /**
   * Get QR code performance metrics
   */
  async getQRPerformanceMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalGenerated: number
    totalScanned: number
    scanRate: number
    avgTimeToScan: number
  }> {
    try {
      const payload = await getPayload({ config })

      const whereCondition: any = {
        qrCodeGenerated: {
          equals: true,
        },
      }

      if (startDate || endDate) {
        whereCondition.createdAt = {}
        if (startDate) {
          whereCondition.createdAt.greater_than_equal = startDate
        }
        if (endDate) {
          whereCondition.createdAt.less_than_equal = endDate
        }
      }

      const orders = await payload.find({
        collection: 'orders',
        where: whereCondition,
        limit: 1000, // Adjust as needed
      })

      const totalGenerated = orders.docs.length
      const scannedOrders = orders.docs.filter((order) => order.qrCodeScannedAt)
      const totalScanned = scannedOrders.length
      const scanRate = totalGenerated > 0 ? (totalScanned / totalGenerated) * 100 : 0

      // Calculate average time to scan
      let totalScanTime = 0
      let validScanTimes = 0

      scannedOrders.forEach((order) => {
        if (order.qrCodeScannedAt && order.createdAt) {
          const scanTime = new Date(order.qrCodeScannedAt).getTime() - new Date(order.createdAt).getTime()
          totalScanTime += scanTime
          validScanTimes++
        }
      })

      const avgTimeToScan = validScanTimes > 0 ? totalScanTime / validScanTimes / (1000 * 60) : 0 // in minutes

      return {
        totalGenerated,
        totalScanned,
        scanRate,
        avgTimeToScan,
      }
    } catch (error) {
      console.error('Error getting QR performance metrics:', error)
      return {
        totalGenerated: 0,
        totalScanned: 0,
        scanRate: 0,
        avgTimeToScan: 0,
      }
    }
  }

  /**
   * Generate QR code data with tracking
   */
  async generateTrackedQR(
    orderId: string,
    staffId?: string,
    location?: string,
    customMessage?: string
  ): Promise<string> {
    try {
      // Track the generation
      await this.trackQRGeneration(orderId, staffId, location)

      // Generate the WhatsApp link
      return this.generateWhatsAppLinkWithOrder(orderId, customMessage)
    } catch (error) {
      console.error('Error generating tracked QR:', error)
      // Fallback to basic generation
      return this.generateWhatsAppLinkWithOrder(orderId, customMessage)
    }
  }

  /**
   * Validate QR code data
   */
  validateQRData(qrData: string): { isValid: boolean; orderId?: string; error?: string } {
    try {
      // Check if it's a WhatsApp link
      if (!qrData.includes('wa.me/')) {
        return { isValid: false, error: 'Not a WhatsApp link' }
      }

      // Extract order ID from the link
      const orderId = this.whatsappService.extractOrderId(decodeURIComponent(qrData))

      if (!orderId) {
        return { isValid: false, error: 'No order ID found in QR code' }
      }

      return { isValid: true, orderId }
    } catch (error) {
      return { isValid: false, error: 'Invalid QR code format' }
    }
  }

  /**
   * Get QR code status for an order
   */
  async getQRStatus(orderId: string): Promise<{
    generated: boolean
    scanned: boolean
    generatedAt?: Date
    scannedAt?: Date
    link?: string
  }> {
    try {
      const payload = await getPayload({ config })

      const orderResult = await payload.find({
        collection: 'orders',
        where: {
          orderID: {
            equals: orderId,
          },
        },
        limit: 1,
      })

      if (orderResult.docs.length === 0) {
        return { generated: false, scanned: false }
      }

      const order = orderResult.docs[0]

      return {
        generated: order.qrCodeGenerated || false,
        scanned: !!order.qrCodeScannedAt,
        generatedAt: order.createdAt,
        scannedAt: order.qrCodeScannedAt,
        link: order.qrCodeGenerated ? this.generateWhatsAppLinkWithOrder(orderId) : undefined,
      }
    } catch (error) {
      console.error('Error getting QR status:', error)
      return { generated: false, scanned: false }
    }
  }
}
