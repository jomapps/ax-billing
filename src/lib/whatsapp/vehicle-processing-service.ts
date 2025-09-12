import axios from 'axios'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Vehicle, Order, User } from '@/payload-types'
import { analyzeVehicle } from '@/lib/ai-service'
import { b } from '@/lib/baml_client/baml_client'
import type { VehicleAnalysis } from '@/lib/baml_client/baml_client/types'

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
   * Process vehicle photo with BAML AI integration (primary method)
   */
  async processVehiclePhotoWithBAML(imageUrl: string): Promise<AIProcessingResult> {
    try {
      console.log('🤖 Starting BAML vehicle processing:', { imageUrl })

      const analysisResult = await analyzeVehicle(imageUrl)

      if (!analysisResult.success || !analysisResult.data) {
        console.log('BAML analysis failed, falling back to FAL AI')
        return await this.processVehiclePhotoWithFalAI(imageUrl)
      }

      const analysis = analysisResult.data

      // Convert BAML analysis to VehicleInfo format
      const vehicleInfo: VehicleInfo = {
        vehicleType: this.mapBamlVehicleType(analysis.vehicle_type),
        licensePlate: this.extractLicensePlate(analysis),
        confidence: 0.9, // BAML generally provides high confidence
        extractedText: analysis.overall_condition,
      }

      console.log('✅ BAML vehicle processing successful:', vehicleInfo)

      return {
        success: true,
        vehicleInfo,
      }
    } catch (error) {
      console.error('❌ BAML vehicle processing error:', error)
      console.log('Falling back to FAL AI processing')
      return await this.processVehiclePhotoWithFalAI(imageUrl)
    }
  }

  /**
   * Process vehicle photo with BAML (primary method) and FAL fallback
   */
  async processVehiclePhotoWithFalAI(imageUrl: string): Promise<AIProcessingResult> {
    try {
      console.log('🤖 Starting BAML vehicle processing:', {
        imageUrl,
      })

      // Try BAML first
      const bamlResult = await b.AnalyzeVehicleImage(imageUrl)

      // Convert BAML result to VehicleInfo format
      const vehicleInfo: VehicleInfo = {
        vehicleType: this.mapBamlVehicleType(bamlResult.vehicle_type),
        licensePlate: this.extractLicensePlate(bamlResult),
        confidence: bamlResult.confidence_score || 0.9,
        extractedText: bamlResult.overall_condition,
      }

      console.log('✅ BAML vehicle processing successful:', vehicleInfo)

      return {
        success: true,
        vehicleInfo,
      }
    } catch (bamlError) {
      console.error('❌ BAML processing failed:', bamlError)
      console.log('🔄 Falling back to FAL AI via BAML...')

      // Fallback to FAL AI via BAML
      try {
        const bamlFalResult = await b.AnalyzeVehicleImageFal(imageUrl)

        // Convert BAML result to VehicleInfo format
        const vehicleInfo: VehicleInfo = {
          vehicleType: this.mapBamlVehicleType(bamlFalResult.vehicle_type),
          licensePlate: this.extractLicensePlate(bamlFalResult),
          confidence: bamlFalResult.confidence_score || 0.5,
          extractedText: bamlFalResult.overall_condition,
        }

        return {
          success: true,
          vehicleInfo,
        }
      } catch (falError) {
        console.error('❌ FAL AI fallback also failed:', falError)
        return {
          success: false,
          error: 'Both BAML and FAL AI processing failed',
        }
      }
    }
  }

  /**
   * Map BAML VehicleType to our internal vehicle type format
   */
  private mapBamlVehicleType(bamlVehicleType: string): string {
    const typeMapping: Record<string, string> = {
      CAR: 'sedan',
      TRUCK: 'truck',
      MOTORCYCLE: 'motorcycle',
      VAN: 'van',
      SUV: 'suv',
      OTHER: 'sedan', // Default fallback
    }

    return typeMapping[bamlVehicleType] || 'sedan'
  }

  /**
   * Extract license plate from BAML analysis with improved logic
   */
  private extractLicensePlate(analysis: VehicleAnalysis): string {
    // First, check if BAML provided a dedicated license_plate field
    if (analysis.license_plate && analysis.license_plate.trim()) {
      return analysis.license_plate.trim()
    }

    // Fallback: Try to extract license plate from various fields
    const possibleSources = [analysis.make, analysis.model, analysis.overall_condition].filter(
      Boolean,
    )

    // Look for license plate patterns in the text using region-specific patterns
    for (const source of possibleSources) {
      if (source) {
        // Malaysian license plate patterns (adjust based on your region)
        const malayPatterns = [
          /[A-Z]{1,3}\s*\d{1,4}\s*[A-Z]?/g, // ABC 123, AB 1234 A
          /[A-Z]{2}\s*\d{4}/g, // AB 1234
          /\b[A-Z0-9]{3,8}\b/g, // General alphanumeric patterns
        ]

        for (const pattern of malayPatterns) {
          const matches = source.match(pattern)
          if (matches && matches.length > 0) {
            // Clean up the match (remove extra spaces)
            const cleanPlate = matches[0].replace(/\s+/g, ' ').trim()
            // Only return if it looks like a valid plate (not too generic)
            if (cleanPlate.length >= 3 && cleanPlate.length <= 10) {
              return cleanPlate
            }
          }
        }
      }
    }

    // If no license plate found, return empty string instead of placeholder
    return ''
  }

  /**
   * Update the main processing method to use BAML
   */
  async processVehiclePhoto(imageUrl: string): Promise<AIProcessingResult> {
    return await this.processVehiclePhotoWithBAML(imageUrl)
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
    mediaId?: string,
  ): Promise<Vehicle> {
    try {
      const payload = await getPayload({ config })

      console.log('🔍 Creating/updating vehicle:', {
        licensePlate: vehicleInfo.licensePlate,
        vehicleType: vehicleInfo.vehicleType,
        customerId,
        mediaId,
        customerIdType: typeof customerId,
        mediaIdType: typeof mediaId,
      })

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
        console.log('🔄 Updating existing vehicle:', vehicle.id)

        const updateData: any = {
          vehicleType: this.mapVehicleType(vehicleInfo.vehicleType),
          isActive: true,
        }

        // Only update image if mediaId is provided
        if (mediaId) {
          updateData.image = mediaId
        }

        const updatedVehicle = await payload.update({
          collection: 'vehicles',
          id: vehicle.id,
          data: updateData,
        })
        return updatedVehicle as Vehicle
      } else {
        // Create new vehicle
        console.log('➕ Creating new vehicle')

        const createData: any = {
          licensePlate: vehicleInfo.licensePlate,
          vehicleType: this.mapVehicleType(vehicleInfo.vehicleType),
          owner: customerId,
          isActive: true,
        }

        // Only add image if mediaId is provided
        if (mediaId) {
          createData.image = mediaId
        }

        const newVehicle = await payload.create({
          collection: 'vehicles',
          data: createData,
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
