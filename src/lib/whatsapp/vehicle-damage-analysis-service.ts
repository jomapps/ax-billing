import axios from 'axios'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { VehicleImage, Vehicle, Media } from '@/payload-types'
import { b } from '@/lib/baml_client/baml_client'
import type { VehicleAnalysis } from '@/lib/baml_client/baml_client/types'

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
   * Analyze a single vehicle image for damage, size, and other features using BAML
   */
  async analyzeVehicleImage(imageUrl: string, imageType: string): Promise<VehicleAnalysisResult> {
    const startTime = Date.now()

    try {
      console.log('🔍 Starting BAML vehicle image analysis:', {
        imageUrl,
        imageType,
      })

      // Use BAML for analysis
      const bamlResult = await b.AnalyzeVehicleDamage(imageUrl, imageType)

      const processingTime = (Date.now() - startTime) / 1000

      console.log('✅ BAML analysis completed:', {
        imageType,
        processingTime,
        vehicleType: bamlResult.vehicle_type,
        damagesFound: bamlResult.damages?.length || 0,
      })

      return this.convertBamlToAnalysisResult(bamlResult, processingTime)
    } catch (error) {
      const processingTime = (Date.now() - startTime) / 1000
      console.error('❌ BAML vehicle image analysis failed:', {
        imageUrl,
        imageType,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
      })

      // Fallback to FAL AI via BAML if primary BAML fails
      console.log('🔄 Falling back to FAL AI via BAML...')
      try {
        const bamlFalResult = await b.AnalyzeVehicleDamageFal(imageUrl, imageType)
        return this.convertBamlToAnalysisResult(bamlFalResult, processingTime)
      } catch (falError) {
        console.error('❌ FAL AI fallback also failed:', falError)
        return {
          success: false,
          error: 'Both BAML and FAL AI analysis failed',
          processingTime,
        }
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
        const analysis = await this.analyzeVehicleImage(
          vehicleImage.imageUrl,
          vehicleImage.imageType,
        )
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
   * Convert BAML result to VehicleAnalysisResult format
   */
  private convertBamlToAnalysisResult(
    bamlResult: VehicleAnalysis,
    processingTime: number,
  ): VehicleAnalysisResult {
    try {
      // Convert BAML damages to our format
      const damageAnalysis =
        bamlResult.damages?.map((damage) => ({
          damageDetected: true,
          damageDescription: damage.description,
          severity: damage.severity.toLowerCase() as 'minor' | 'moderate' | 'major' | 'severe',
          location: damage.location,
          confidence: bamlResult.confidence_score || 0.9,
        })) || []

      // Estimate size based on vehicle type
      const sizeAnalysis = this.estimateVehicleSize(bamlResult.vehicle_type)

      return {
        success: true,
        vehicleNumber: bamlResult.license_plate || undefined,
        sizeAnalysis,
        damageAnalysis,
        overallCondition: this.mapOverallCondition(bamlResult.overall_condition),
        colorAnalysis: bamlResult.color || undefined,
        visibleFeatures: this.extractVisibleFeatures(bamlResult),
        extractedText: bamlResult.license_plate || undefined,
        processingTime,
        rawAiResponse: bamlResult,
      }
    } catch (error) {
      console.error('Failed to convert BAML result:', error)
      return {
        success: false,
        error: 'Failed to convert BAML analysis result',
        processingTime,
        rawAiResponse: bamlResult,
      }
    }
  }

  /**
   * Estimate vehicle size based on vehicle type
   */
  private estimateVehicleSize(vehicleType: string): VehicleSizeAnalysis {
    const sizeMap: Record<string, VehicleSizeAnalysis> = {
      CAR: {
        estimatedLength: 4.5,
        estimatedWidth: 1.8,
        estimatedHeight: 1.5,
        sizeCategory: 'midsize',
        confidence: 0.8,
      },
      SUV: {
        estimatedLength: 4.8,
        estimatedWidth: 1.9,
        estimatedHeight: 1.8,
        sizeCategory: 'large',
        confidence: 0.8,
      },
      TRUCK: {
        estimatedLength: 5.5,
        estimatedWidth: 2.0,
        estimatedHeight: 1.9,
        sizeCategory: 'extra_large',
        confidence: 0.8,
      },
      VAN: {
        estimatedLength: 5.0,
        estimatedWidth: 1.9,
        estimatedHeight: 2.0,
        sizeCategory: 'large',
        confidence: 0.8,
      },
      MOTORCYCLE: {
        estimatedLength: 2.2,
        estimatedWidth: 0.8,
        estimatedHeight: 1.2,
        sizeCategory: 'compact',
        confidence: 0.8,
      },
    }

    return sizeMap[vehicleType] || sizeMap.CAR
  }

  /**
   * Map BAML overall condition to our format
   */
  private mapOverallCondition(
    condition: string,
  ): 'excellent' | 'good' | 'fair' | 'poor' | 'damaged' {
    const conditionLower = condition.toLowerCase()
    if (conditionLower.includes('excellent')) return 'excellent'
    if (conditionLower.includes('good')) return 'good'
    if (conditionLower.includes('fair')) return 'fair'
    if (conditionLower.includes('poor')) return 'poor'
    if (conditionLower.includes('damaged')) return 'damaged'
    return 'good' // default
  }

  /**
   * Extract visible features from BAML result
   */
  private extractVisibleFeatures(bamlResult: VehicleAnalysis): string[] {
    const features: string[] = []

    if (bamlResult.vehicle_type) features.push(bamlResult.vehicle_type.toLowerCase())
    if (bamlResult.make) features.push(bamlResult.make)
    if (bamlResult.model) features.push(bamlResult.model)
    if (bamlResult.color) features.push(bamlResult.color)

    return features
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
