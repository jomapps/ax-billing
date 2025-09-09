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
  private falApiKey: string
  private falVisionModel: string

  constructor() {
    this.falApiKey = process.env.FAL_KEY!
    this.falVisionModel = process.env.FAL_VISION_MODEL || 'fal-ai/moondream2/visual-query'

    if (!this.falApiKey) {
      console.warn('Fal.ai API key not configured. AI processing will be disabled.')
    }
  }

  /**
   * Process vehicle photo with AI to extract vehicle type and license plate
   */
  async processVehiclePhoto(imageUrl: string): Promise<AIProcessingResult> {
    if (!this.falApiKey) {
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
        `https://fal.run/${this.falVisionModel}`,
        {
          image_url: imageUrl,
          prompt: prompt,
        },
        {
          headers: {
            Authorization: `Key ${this.falApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      )

      const aiResponse = response.data.output
      if (!aiResponse) {
        throw new Error('No response from AI model')
      }

      // Try to parse JSON response, fallback to text parsing if needed
      let vehicleInfo: VehicleInfo
      try {
        // Clean the response to extract just the JSON part
        const cleanResponse = aiResponse.trim()
        let jsonStr = cleanResponse

        // If the response contains extra text, try to extract the JSON part
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          jsonStr = jsonMatch[0]
        }

        vehicleInfo = JSON.parse(jsonStr) as VehicleInfo
      } catch (parseError) {
        console.warn('Failed to parse JSON response, falling back to text parsing:', parseError)
        // If JSON parsing fails, try to extract information from text
        vehicleInfo = this.parseTextResponse(aiResponse)
      }

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
   * Parse text response when JSON parsing fails
   */
  private parseTextResponse(text: string): VehicleInfo {
    const vehicleInfo: VehicleInfo = {
      vehicleType: 'sedan',
      licensePlate: '',
      confidence: 0.5,
      extractedText: text,
    }

    // Extract vehicle type
    const vehicleTypes = [
      'sedan',
      'suv',
      'hatchback',
      'mpv',
      'pickup',
      'motorcycle',
      'heavy_bike',
      'van',
      'truck',
    ]
    for (const type of vehicleTypes) {
      if (text.toLowerCase().includes(type.toLowerCase())) {
        vehicleInfo.vehicleType = type
        break
      }
    }

    // Extract license plate using regex patterns
    const platePatterns = [
      /[A-Z]{1,3}[-\s]?\d{1,4}[-\s]?[A-Z]?/g, // Common patterns like ABC-123, AB-1234
      /\b[A-Z0-9]{3,8}\b/g, // General alphanumeric patterns
    ]

    for (const pattern of platePatterns) {
      const matches = text.match(pattern)
      if (matches && matches.length > 0) {
        vehicleInfo.licensePlate = matches[0].replace(/[-\s]/g, '')
        break
      }
    }

    return vehicleInfo
  }

  /**
   * Create or update vehicle record in database
   */
  async createOrUpdateVehicle(
    vehicleInfo: VehicleInfo,
    customerId: string,
    imageUrl?: string,
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
            vehicleType: this.mapVehicleType(vehicleInfo.vehicleType),
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
            vehicleType: this.mapVehicleType(vehicleInfo.vehicleType),
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
          vehicleCapturedAt: new Date().toISOString(),
          aiProcessedAt: new Date().toISOString(),
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
    customerId: string,
  ): Promise<{ vehicle: Vehicle; order: Order; aiResult: AIProcessingResult }> {
    try {
      // Process image with AI
      const aiResult = await this.processVehiclePhoto(imageUrl)

      if (!aiResult.success || !aiResult.vehicleInfo) {
        throw new Error(aiResult.error || 'AI processing failed')
      }

      // Create or update vehicle record
      const vehicle = await this.createOrUpdateVehicle(aiResult.vehicleInfo, customerId, imageUrl)

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
    imageUrl?: string,
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

  /**
   * Map vehicle type to valid enum values
   */
  private mapVehicleType(
    vehicleType: string,
  ): 'sedan' | 'mpv_van' | 'large_pickup' | 'regular_bike' | 'heavy_bike' | 'very_heavy_bike' {
    const lowerType = vehicleType.toLowerCase()

    if (lowerType.includes('sedan')) return 'sedan'
    if (lowerType.includes('mpv') || lowerType.includes('van')) return 'mpv_van'
    if (lowerType.includes('pickup') || lowerType.includes('truck')) return 'large_pickup'
    if (lowerType.includes('heavy bike') || lowerType.includes('heavy motorcycle'))
      return 'heavy_bike'
    if (lowerType.includes('very heavy') || lowerType.includes('super heavy'))
      return 'very_heavy_bike'
    if (lowerType.includes('bike') || lowerType.includes('motorcycle')) return 'regular_bike'

    // Default fallback
    return 'sedan'
  }
}
