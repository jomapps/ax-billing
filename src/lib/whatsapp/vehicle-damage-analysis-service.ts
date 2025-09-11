import axios from 'axios'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { VehicleImage, Vehicle, Media } from '@/payload-types'

export interface DamageAnalysis {
  damageDetected: boolean
  damageDescription?: string
  severity: 'minor' | 'moderate' | 'major' | 'severe'
  location: string
  confidence: number
}

export interface VehicleSizeAnalysis {
  estimatedLength: number
  estimatedWidth: number
  estimatedHeight: number
  sizeCategory: 'compact' | 'midsize' | 'large' | 'extra_large'
  confidence: number
}

export interface VehicleAnalysisResult {
  success: boolean
  vehicleNumber?: string
  sizeAnalysis?: VehicleSizeAnalysis
  damageAnalysis?: DamageAnalysis[]
  overallCondition?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
  colorAnalysis?: string
  visibleFeatures?: string[]
  extractedText?: string
  processingTime?: number
  error?: string
  rawAiResponse?: any
}

export interface MultiImageAnalysisResult {
  success: boolean
  vehicleNumber?: string
  consolidatedSizeAnalysis?: VehicleSizeAnalysis
  allDamages?: DamageAnalysis[]
  overallCondition?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
  imageAnalyses?: { [imageId: string]: VehicleAnalysisResult }
  error?: string
}

export class VehicleDamageAnalysisService {
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
   * Analyze a single vehicle image for damage, size, and other features
   */
  async analyzeVehicleImage(imageUrl: string, imageType: string): Promise<VehicleAnalysisResult> {
    if (!this.falApiKey) {
      return {
        success: false,
        error: 'Fal.ai API key not configured',
      }
    }

    const startTime = Date.now()

    try {
      console.log('🔍 Starting vehicle image analysis:', {
        imageUrl,
        imageType,
        model: this.falVisionModel,
      })

      const prompt = this.buildAnalysisPrompt(imageType)

      const response = await axios.post(
        `https://fal.run/${this.falVisionModel}`,
        {
          image_url: imageUrl,
          prompt: prompt,
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Key ${this.falApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 second timeout
        },
      )

      const processingTime = (Date.now() - startTime) / 1000

      if (response.data && response.data.output) {
        const aiResponse = response.data.output
        console.log('✅ AI analysis completed:', {
          imageType,
          processingTime,
          responseLength: aiResponse.length,
        })

        return this.parseAiResponse(aiResponse, processingTime)
      } else {
        throw new Error('Invalid response from Fal.ai API')
      }
    } catch (error) {
      const processingTime = (Date.now() - startTime) / 1000
      console.error('❌ Vehicle image analysis failed:', {
        imageUrl,
        imageType,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
      }
    }
  }

  /**
   * Analyze multiple vehicle images and consolidate results
   */
  async analyzeMultipleImages(
    vehicleImages: Array<{ id: string; imageUrl: string; imageType: string }>,
  ): Promise<MultiImageAnalysisResult> {
    try {
      console.log('🚗 Starting multi-image vehicle analysis:', {
        imageCount: vehicleImages.length,
        imageTypes: vehicleImages.map((img) => img.imageType),
      })

      const imageAnalyses: { [imageId: string]: VehicleAnalysisResult } = {}
      const allDamages: DamageAnalysis[] = []
      const sizeAnalyses: VehicleSizeAnalysis[] = []
      const vehicleNumbers: string[] = []
      const colors: string[] = []
      const features: string[] = []

      // Process each image
      for (const vehicleImage of vehicleImages) {
        const analysis = await this.analyzeVehicleImage(vehicleImage.imageUrl, vehicleImage.imageType)
        imageAnalyses[vehicleImage.id] = analysis

        if (analysis.success) {
          // Collect vehicle numbers
          if (analysis.vehicleNumber) {
            vehicleNumbers.push(analysis.vehicleNumber)
          }

          // Collect damage analyses
          if (analysis.damageAnalysis) {
            allDamages.push(...analysis.damageAnalysis)
          }

          // Collect size analyses
          if (analysis.sizeAnalysis) {
            sizeAnalyses.push(analysis.sizeAnalysis)
          }

          // Collect colors
          if (analysis.colorAnalysis) {
            colors.push(analysis.colorAnalysis)
          }

          // Collect features
          if (analysis.visibleFeatures) {
            features.push(...analysis.visibleFeatures)
          }
        }
      }

      // Consolidate results
      const consolidatedResult: MultiImageAnalysisResult = {
        success: true,
        imageAnalyses,
        allDamages,
      }

      // Determine most likely vehicle number
      if (vehicleNumbers.length > 0) {
        consolidatedResult.vehicleNumber = this.getMostFrequent(vehicleNumbers)
      }

      // Consolidate size analysis
      if (sizeAnalyses.length > 0) {
        consolidatedResult.consolidatedSizeAnalysis = this.consolidateSizeAnalyses(sizeAnalyses)
      }

      // Determine overall condition
      consolidatedResult.overallCondition = this.determineOverallCondition(allDamages)

      console.log('✅ Multi-image analysis completed:', {
        imageCount: vehicleImages.length,
        damagesFound: allDamages.length,
        vehicleNumber: consolidatedResult.vehicleNumber,
        overallCondition: consolidatedResult.overallCondition,
      })

      return consolidatedResult
    } catch (error) {
      console.error('❌ Multi-image analysis failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Build AI prompt based on image type
   */
  private buildAnalysisPrompt(imageType: string): string {
    const basePrompt = `
      Analyze this vehicle image and provide a comprehensive assessment. Focus on:
      1. Vehicle license plate number (extract exact text)
      2. Vehicle size estimation (length, width, height in meters)
      3. Damage detection and description
      4. Overall vehicle condition
      5. Vehicle color analysis
      6. Visible features and characteristics
    `

    const typeSpecificPrompts = {
      front: `
        This is a front view of the vehicle. Pay special attention to:
        - Front license plate
        - Front bumper damage
        - Headlight condition
        - Windshield condition
        - Hood damage
      `,
      back: `
        This is a rear view of the vehicle. Pay special attention to:
        - Rear license plate
        - Rear bumper damage
        - Taillight condition
        - Rear windshield condition
        - Trunk/tailgate damage
      `,
      left: `
        This is a left side view of the vehicle. Pay special attention to:
        - Left side doors
        - Left side windows
        - Left side mirrors
        - Side panel damage
        - Wheel condition
      `,
      right: `
        This is a right side view of the vehicle. Pay special attention to:
        - Right side doors
        - Right side windows
        - Right side mirrors
        - Side panel damage
        - Wheel condition
      `,
      damage: `
        This is a close-up damage photo. Provide detailed analysis of:
        - Type of damage (scratch, dent, crack, etc.)
        - Severity assessment
        - Exact location on vehicle
        - Potential cause
      `,
      license_plate: `
        This is a license plate close-up. Focus on:
        - Exact license plate text
        - Plate condition
        - Any damage to the plate
      `,
    }

    const specificPrompt = typeSpecificPrompts[imageType as keyof typeof typeSpecificPrompts] || ''

    return `${basePrompt}${specificPrompt}

    Please respond in JSON format:
    {
      "vehicleNumber": "extracted license plate text or null",
      "sizeAnalysis": {
        "estimatedLength": 4.5,
        "estimatedWidth": 1.8,
        "estimatedHeight": 1.5,
        "sizeCategory": "midsize",
        "confidence": 0.85
      },
      "damageAnalysis": [
        {
          "damageDetected": true,
          "damageDescription": "Minor scratch on front bumper",
          "severity": "minor",
          "location": "front bumper left side",
          "confidence": 0.9
        }
      ],
      "overallCondition": "good",
      "colorAnalysis": "Dark blue metallic",
      "visibleFeatures": ["sedan", "4-door", "alloy wheels"],
      "extractedText": "any other visible text"
    }

    If no damage is detected, set damageAnalysis to an empty array.
    If license plate is not visible or readable, set vehicleNumber to null.
    `
  }

  /**
   * Parse AI response and extract structured data
   */
  private parseAiResponse(aiResponse: string, processingTime: number): VehicleAnalysisResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response')
      }

      const parsedResponse = JSON.parse(jsonMatch[0])

      return {
        success: true,
        vehicleNumber: parsedResponse.vehicleNumber || undefined,
        sizeAnalysis: parsedResponse.sizeAnalysis || undefined,
        damageAnalysis: parsedResponse.damageAnalysis || [],
        overallCondition: parsedResponse.overallCondition || undefined,
        colorAnalysis: parsedResponse.colorAnalysis || undefined,
        visibleFeatures: parsedResponse.visibleFeatures || [],
        extractedText: parsedResponse.extractedText || undefined,
        processingTime,
        rawAiResponse: parsedResponse,
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      return {
        success: false,
        error: 'Failed to parse AI response',
        processingTime,
        rawAiResponse: aiResponse,
      }
    }
  }

  /**
   * Get most frequent item from array
   */
  private getMostFrequent(items: string[]): string {
    const frequency: { [key: string]: number } = {}
    items.forEach((item) => {
      frequency[item] = (frequency[item] || 0) + 1
    })

    return Object.keys(frequency).reduce((a, b) => (frequency[a] > frequency[b] ? a : b))
  }

  /**
   * Consolidate multiple size analyses into one
   */
  private consolidateSizeAnalyses(analyses: VehicleSizeAnalysis[]): VehicleSizeAnalysis {
    const avgLength = analyses.reduce((sum, a) => sum + a.estimatedLength, 0) / analyses.length
    const avgWidth = analyses.reduce((sum, a) => sum + a.estimatedWidth, 0) / analyses.length
    const avgHeight = analyses.reduce((sum, a) => sum + a.estimatedHeight, 0) / analyses.length
    const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length

    // Determine size category based on average dimensions
    let sizeCategory: 'compact' | 'midsize' | 'large' | 'extra_large' = 'midsize'
    if (avgLength < 4.2) sizeCategory = 'compact'
    else if (avgLength > 5.0) sizeCategory = 'large'
    else if (avgLength > 5.5) sizeCategory = 'extra_large'

    return {
      estimatedLength: Math.round(avgLength * 100) / 100,
      estimatedWidth: Math.round(avgWidth * 100) / 100,
      estimatedHeight: Math.round(avgHeight * 100) / 100,
      sizeCategory,
      confidence: Math.round(avgConfidence * 100) / 100,
    }
  }

  /**
   * Determine overall condition based on damage analyses
   */
  private determineOverallCondition(
    damages: DamageAnalysis[],
  ): 'excellent' | 'good' | 'fair' | 'poor' | 'damaged' {
    if (damages.length === 0) return 'excellent'

    const severeDamages = damages.filter((d) => d.severity === 'severe').length
    const majorDamages = damages.filter((d) => d.severity === 'major').length
    const moderateDamages = damages.filter((d) => d.severity === 'moderate').length

    if (severeDamages > 0) return 'damaged'
    if (majorDamages > 2) return 'poor'
    if (majorDamages > 0 || moderateDamages > 3) return 'fair'
    if (moderateDamages > 0 || damages.length > 2) return 'good'

    return 'excellent'
  }
}
