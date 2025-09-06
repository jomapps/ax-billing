import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Order, User } from '@/payload-types'
import { WhatsAppService } from './whatsapp-service'

export type OrderStage = 'empty' | 'initiated' | 'open' | 'billed' | 'paid'

export class OrderLinkingService {
  private whatsappService: WhatsAppService

  constructor() {
    this.whatsappService = new WhatsAppService()
  }

  /**
   * Extract order ID from WhatsApp message content
   */
  extractOrderId(messageContent: string): string | null {
    return this.whatsappService.extractOrderId(messageContent)
  }

  /**
   * Validate that an order exists and can be linked
   */
  async validateOrderForLinking(orderId: string): Promise<boolean> {
    try {
      const payload = await getPayload({ config })

      const result = await payload.find({
        collection: 'orders',
        where: {
          orderID: {
            equals: orderId,
          },
        },
        limit: 1,
      })

      if (result.docs.length === 0) {
        return false
      }

      const order = result.docs[0] as Order

      // Order should be in 'empty' stage and not already linked
      return order.orderStage === 'empty' && !order.whatsappLinked
    } catch (error) {
      console.error('Error validating order for linking:', error)
      return false
    }
  }

  /**
   * Find user by WhatsApp number
   */
  async findUserByWhatsApp(whatsappNumber: string): Promise<User | null> {
    try {
      const payload = await getPayload({ config })
      const formattedNumber = this.whatsappService.formatPhoneNumber(whatsappNumber)
      const email = `${formattedNumber}@ft.tc`

      const result = await payload.find({
        collection: 'users',
        where: {
          or: [
            {
              whatsappNumber: {
                equals: formattedNumber,
              },
            },
            {
              email: {
                equals: email,
              },
            },
          ],
        },
        limit: 1,
      })

      return result.docs.length > 0 ? (result.docs[0] as User) : null
    } catch (error) {
      console.error('Error finding user by WhatsApp:', error)
      return null
    }
  }

  /**
   * Create new user from WhatsApp contact
   */
  async createUserFromWhatsApp(whatsappNumber: string, name?: string): Promise<User> {
    try {
      const payload = await getPayload({ config })
      const formattedNumber = this.whatsappService.formatPhoneNumber(whatsappNumber)

      // Generate email from phone number: [phone_number]@ft.tc
      const email = `${formattedNumber}@ft.tc`
      const password = 'Ax#123456' // Default password as specified

      // Parse name if provided
      const nameParts = name ? name.split(' ') : []
      const firstName = nameParts[0] || 'Customer'
      const lastName = nameParts.slice(1).join(' ') || ''

      const user = await payload.create({
        collection: 'users',
        data: {
          email,
          password,
          role: 'customer',
          whatsappNumber: formattedNumber,
          whatsappVerified: true,
          whatsappOptIn: true,
          lastWhatsappContact: new Date().toISOString(),
          firstName,
          lastName,
        },
      })

      return user as User
    } catch (error) {
      console.error('Error creating user from WhatsApp:', error)
      throw error
    }
  }

  /**
   * Link WhatsApp number to existing order
   */
  async linkWhatsAppToOrder(whatsappNumber: string, orderId: string, user?: User): Promise<Order> {
    try {
      const payload = await getPayload({ config })
      const formattedNumber = this.whatsappService.formatPhoneNumber(whatsappNumber)

      // Find the order
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
        throw new Error(`Order ${orderId} not found`)
      }

      const order = orderResult.docs[0] as Order

      // Update order with WhatsApp linking information
      const updatedOrder = await payload.update({
        collection: 'orders',
        id: order.id,
        data: {
          whatsappLinked: true,
          whatsappNumber: formattedNumber,
          qrCodeScannedAt: new Date().toISOString(),
          orderStage: 'initiated',
          customer: user?.id, // Link customer if provided
        },
      })

      return updatedOrder as Order
    } catch (error) {
      console.error('Error linking WhatsApp to order:', error)
      throw error
    }
  }

  /**
   * Create user and link to order in one operation
   */
  async createUserAndLinkOrder(
    whatsappNumber: string,
    orderId: string,
    name?: string,
  ): Promise<{ user: User; order: Order }> {
    try {
      // Create the user first
      const user = await this.createUserFromWhatsApp(whatsappNumber, name)

      // Link the order to the user
      const order = await this.linkWhatsAppToOrder(whatsappNumber, orderId, user)

      return { user, order }
    } catch (error) {
      console.error('Error creating user and linking order:', error)
      throw error
    }
  }

  /**
   * Update order stage
   */
  async updateOrderStage(orderId: string, stage: OrderStage): Promise<Order> {
    try {
      const payload = await getPayload({ config })

      // Find the order
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
        throw new Error(`Order ${orderId} not found`)
      }

      const order = orderResult.docs[0] as Order

      // Update the order stage
      const updatedOrder = await payload.update({
        collection: 'orders',
        id: order.id,
        data: {
          orderStage: stage,
        },
      })

      return updatedOrder as Order
    } catch (error) {
      console.error('Error updating order stage:', error)
      throw error
    }
  }

  /**
   * Get orders by stage
   */
  async getOrdersByStage(stage: OrderStage, limit: number = 50): Promise<Order[]> {
    try {
      const payload = await getPayload({ config })

      const result = await payload.find({
        collection: 'orders',
        where: {
          orderStage: {
            equals: stage,
          },
        },
        limit,
        sort: '-createdAt',
      })

      return result.docs as Order[]
    } catch (error) {
      console.error('Error getting orders by stage:', error)
      return []
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const payload = await getPayload({ config })

      const result = await payload.find({
        collection: 'orders',
        where: {
          orderID: {
            equals: orderId,
          },
        },
        limit: 1,
      })

      return result.docs.length > 0 ? (result.docs[0] as Order) : null
    } catch (error) {
      console.error('Error getting order by ID:', error)
      return null
    }
  }
}
