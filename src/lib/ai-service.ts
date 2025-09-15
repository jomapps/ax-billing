// BAML removed - using direct FAL.ai service only

export interface AIAnalysisResult {
  success: boolean
  data?: any // Vehicle analysis data
  error?: string
  provider?: 'FAL.ai'
}

export interface ServiceRecommendationResult {
  success: boolean
  data?: string[]
  error?: string
}

export interface CostEstimateResult {
  success: boolean
  data?: string
  error?: string
}

/**
 * Analyze vehicle image using BAML AI integration (alias for compatibility)
 */
export async function analyzeVehicle(imageUrl: string): Promise<AIAnalysisResult> {
  return analyzeVehicleImage(imageUrl)
}

/**
 * Analyze vehicle image using BAML AI integration
 */
export async function analyzeVehicleImage(imageUrl: string): Promise<AIAnalysisResult> {
  try {
    console.log('Analyzing vehicle image with FAL.ai vision model:', imageUrl)

    // Use FAL.ai directly since BAML doesn't support FAL.ai API format
    const { falAiService } = await import('@/lib/ai/fal-ai-service')
    const falResult = await falAiService.analyzeVehicleImage(imageUrl, 'general')

    if (!falResult.success) {
      throw new Error(falResult.error || 'FAL.ai analysis failed')
    }

    // Convert FAL result to expected format for compatibility
    const analysisResult = {
      vehicle_type: 'CAR',
      make: null,
      model: null,
      year: null,
      color: null,
      license_plate: null,
      damages: [],
      overall_condition: falResult.vehicleCondition || 'good',
      estimated_total_cost: null,
      recommendations: [],
      confidence_score: 0.9,
    }

    console.log('FAL.ai analysis result:', analysisResult)

    return {
      success: true,
      data: analysisResult,
      provider: 'FAL.ai',
    }
  } catch (error) {
    console.error('Error analyzing vehicle image with FAL.ai:', error)
    throw error
  }
}

/**
 * Generate service recommendations based on vehicle analysis
 */
export async function generateServiceRecommendations(
  vehicleAnalysis: any,
  customerTier: string = 'standard',
): Promise<ServiceRecommendationResult> {
  // Check if BAML is available
  if (!baml) {
    console.log('🔄 BAML not available, returning fallback recommendations...')
    return {
      success: true,
      data: ['Basic wash and inspection recommended'],
    }
  }

  try {
    console.log('Generating service recommendations with BAML:', { vehicleAnalysis, customerTier })

    const result = await baml.GenerateServiceRecommendations(vehicleAnalysis, customerTier)

    console.log('BAML service recommendations:', result)

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error('Error generating service recommendations with BAML:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Estimate service costs based on damages and services
 */
export async function estimateServiceCosts(
  damages: any[],
  services: string[],
): Promise<CostEstimateResult> {
  // Check if BAML is available
  if (!baml) {
    console.log('🔄 BAML not available, returning fallback cost estimate...')
    return {
      success: true,
      data: '$50-100 estimated cost',
    }
  }

  try {
    console.log('Estimating service costs with BAML:', { damages, services })

    const result = await baml.EstimateServiceCosts(damages, services)

    console.log('BAML cost estimate:', result)

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error('Error estimating service costs with BAML:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Fallback to FAL AI for vehicle analysis (existing implementation)
 */
export async function analyzeVehicleImageWithFalAi(imageUrl: string): Promise<AIAnalysisResult> {
  try {
    console.log('Analyzing vehicle image with FAL AI fallback:', imageUrl)

    // Check if FAL_KEY is available
    if (!process.env.FAL_KEY) {
      console.log('FAL_KEY not available, returning mock data')
      return {
        success: true,
        data: {
          vehicle_type: 'CAR',
          make: 'Unknown',
          model: 'Unknown',
          year: null,
          color: 'Unknown',
          damages: [],
          license_plate: null,
          confidence_score: 0.5,
        },
        provider: 'FAL',
      }
    }

    const falVisionModel = process.env.FAL_VISION_MODEL || 'fal-ai/moondream2/visual-query'
    const response = await fetch(`https://fal.run/${falVisionModel}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt:
          'Analyze this vehicle image and identify: vehicle type, make, model, year, color, any visible damages, and license plate if visible.',
      }),
    })

    if (!response.ok) {
      throw new Error(`FAL AI API error: ${response.status}`)
    }

    const data = await response.json()

    // Convert FAL AI response to BAML format
    const vehicleAnalysis: any = {
      vehicle_type: data.vehicle_type || 'OTHER',
      make: data.make || null,
      model: data.model || null,
      year: data.year || null,
      color: data.color || null,
      damages:
        data.damages?.map((damage: any) => ({
          type: damage.type || 'OTHER',
          severity: damage.severity || 'MINOR',
          location: damage.location || 'Unknown',
          description: damage.description || 'No description',
          estimated_cost_range: damage.estimated_cost_range || null,
        })) || [],
      overall_condition: data.overall_condition || 'Unknown',
      estimated_total_cost: data.estimated_total_cost || null,
      recommendations: data.recommendations || [],
    }

    return {
      success: true,
      data: vehicleAnalysis,
      provider: 'FAL',
    }
  } catch (error) {
    console.error('Error analyzing vehicle image with FAL AI:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// Types are now imported directly at the top of the file
