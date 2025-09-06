import axios from 'axios'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Vehicle, Order, User } from '@/payload-types'

export interface VehicleInfo {
  vehicleType: string
  licensePlate: string
  confidence: number
  extractedText?: string
}

export interface AIProcessingResult {
  success: boolean
  vehicleInfo?: VehicleInfo
  error?: string
}

export class VehicleProcessingService {
  private openRouterApiKey: string
  private openRouterModel: string
  private openRouterBaseUrl: string

  constructor() {
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY!
    this.openRouterModel = process.env.OPENROUTER_MODEL || 'gpt-4-vision-preview'
    this.openRouterBaseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'

    if (!this.openRouterApiKey) {
      console.warn('OpenRouter API key not configured. AI processing will be disabled.')
    }
  }

  /**
   * Process vehicle photo with AI to extract vehicle type and license plate
   */
  async processVehiclePhoto(imageUrl: string): Promise<AIProcessingResult> {
    if (!this.openRouterApiKey) {
      return {
        success: false,
        error: 'AI processing not configured',
      }
    }

    try {
      const prompt = `
        Analyze this vehicle image and extract the following information:
        1. Vehicle type (classify as: sedan, suv, hatchback, mpv, pickup, motorcycle, heavy_bike, van, truck)
        2. License plate number (extract the exact text)
        
        Please respond in JSON format:
        {
          "vehicleType": "sedan|suv|hatchback|mpv|pickup|motorcycle|heavy_bike|van|truck",
          "licensePlate": "extracted license plate text",
          "confidence": 0.95,
          "extractedText": "any other text visible on the vehicle"
        }
        
        If you cannot clearly identify the vehicle type or license plate, set confidence to a lower value.
      `

      const response = await axios.post(
        `${this.openRouterBaseUrl}/chat/completions`,
        {
          model: this.openRouterModel,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl,
                  },
                },
              ],
            },
          ],
          max_tokens: 500,
          temperature: 0.1,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'AX Billing Vehicle Processing',
          },
        }
      )

      const aiResponse = response.data.choices[0]?.message?.content
      if (!aiResponse) {
        throw new Error('No response from AI model')
      }

      // Parse JSON response
      const vehicleInfo = JSON.parse(aiResponse) as VehicleInfo

      // Validate the response
      if (!vehicleInfo.vehicleType || !vehicleInfo.licensePlate) {
        throw new Error('Incomplete vehicle information extracted')
      }

      return {
        success: true,
        vehicleInfo,
      }
    } catch (error) {
      console.error('AI processing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown AI processing error',
      }
    }
  }

  /**
   * Create or update vehicle record in database
   */
  async createOrUpdateVehicle(
    vehicleInfo: VehicleInfo,
    customerId: string,
    imageUrl?: string
  ): Promise<Vehicle> {
    try {
      const payload = await getPayload({ config })

      // Check if vehicle with this license plate already exists for this customer
      const existingVehicle = await payload.find({
        collection: 'vehicles',
        where: {
          and: [
            {
              licensePlate: {
                equals: vehicleInfo.licensePlate,
              },
            },
            {
              owner: {
                equals: customerId,
              },
            },
          ],
        },
        limit: 1,
      })

      if (existingVehicle.docs.length > 0) {
        // Update existing vehicle
        const vehicle = existingVehicle.docs[0] as Vehicle
        const updatedVehicle = await payload.update({
          collection: 'vehicles',
          id: vehicle.id,
          data: {
            vehicleType: vehicleInfo.vehicleType,
            image: imageUrl,
            isActive: true,
            // Update any other relevant fields
          },
        })
        return updatedVehicle as Vehicle
      } else {
        // Create new vehicle
        const newVehicle = await payload.create({
          collection: 'vehicles',
          data: {
            licensePlate: vehicleInfo.licensePlate,
            vehicleType: vehicleInfo.vehicleType,
            owner: customerId,
            image: imageUrl,
            isActive: true,
          },
        })
        return newVehicle as Vehicle
      }
    } catch (error) {
      console.error('Error creating/updating vehicle:', error)
      throw error
    }
  }

  /**
   * Link vehicle to order and update order stage
   */
  async linkVehicleToOrder(vehicleId: string, orderId: string): Promise<Order> {
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

      // Update order with vehicle information
      const updatedOrder = await payload.update({
        collection: 'orders',
        id: order.id,
        data: {
          vehicle: vehicleId,
          vehicleCapturedAt: new Date(),
          aiProcessedAt: new Date(),
          orderStage: 'open',
        },
      })

      return updatedOrder as Order
    } catch (error) {
      console.error('Error linking vehicle to order:', error)
      throw error
    }
  }

  /**
   * Process vehicle photo and complete the full workflow
   */
  async processVehicleForOrder(
    imageUrl: string,
    orderId: string,
    customerId: string
  ): Promise<{ vehicle: Vehicle; order: Order; aiResult: AIProcessingResult }> {
    try {
      // Process image with AI
      const aiResult = await this.processVehiclePhoto(imageUrl)

      if (!aiResult.success || !aiResult.vehicleInfo) {
        throw new Error(aiResult.error || 'AI processing failed')
      }

      // Create or update vehicle record
      const vehicle = await this.createOrUpdateVehicle(
        aiResult.vehicleInfo,
        customerId,
        imageUrl
      )

      // Link vehicle to order
      const order = await this.linkVehicleToOrder(vehicle.id, orderId)

      return {
        vehicle,
        order,
        aiResult,
      }
    } catch (error) {
      console.error('Error in vehicle processing workflow:', error)
      throw error
    }
  }

  /**
   * Get vehicle by license plate
   */
  async getVehicleByLicensePlate(licensePlate: string, ownerId?: string): Promise<Vehicle | null> {
    try {
      const payload = await getPayload({ config })

      const whereCondition: any = {
        licensePlate: {
          equals: licensePlate,
        },
      }

      if (ownerId) {
        whereCondition.owner = {
          equals: ownerId,
        }
      }

      const result = await payload.find({
        collection: 'vehicles',
        where: whereCondition,
        limit: 1,
      })

      return result.docs.length > 0 ? (result.docs[0] as Vehicle) : null
    } catch (error) {
      console.error('Error getting vehicle by license plate:', error)
      return null
    }
  }

  /**
   * Validate vehicle information manually (fallback for AI failures)
   */
  async validateVehicleManually(
    licensePlate: string,
    vehicleType: string,
    customerId: string,
    imageUrl?: string
  ): Promise<Vehicle> {
    try {
      const vehicleInfo: VehicleInfo = {
        licensePlate,
        vehicleType,
        confidence: 1.0, // Manual validation is 100% confident
      }

      return await this.createOrUpdateVehicle(vehicleInfo, customerId, imageUrl)
    } catch (error) {
      console.error('Error in manual vehicle validation:', error)
      throw error
    }
  }
}
