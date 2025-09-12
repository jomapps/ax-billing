import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  analyzeVehicle,
  generateServiceRecommendations,
  estimateServiceCosts,
} from '@/lib/ai-service'

// Validation schema for vehicle analysis output
const VehicleAnalysisSchema = z.object({
  vehicle_type: z.string(),
  make: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  year: z.number().nullable().optional(),
  color: z.string().nullable().optional(),
  license_plate: z.string().nullable().optional(),
  damages: z
    .array(
      z.object({
        type: z.string(),
        severity: z.string(),
        location: z.string(),
        description: z.string(),
        estimated_cost_range: z.string().nullable().optional(),
      }),
    )
    .optional(),
  overall_condition: z.string(),
  estimated_total_cost: z.string().nullable().optional(),
  recommendations: z.array(z.string()).optional(),
  confidence_score: z.number().nullable().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      imageUrl,
      customerTier = 'standard',
      generateRecommendations = false,
      includeRecommendations = false,
      includeCostEstimate = false,
    } = body

    // Support both parameter names for compatibility
    const shouldGenerateRecommendations = generateRecommendations || includeRecommendations

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    console.log('🤖 AI Analysis Request:', {
      imageUrl,
      customerTier,
      shouldGenerateRecommendations,
      includeCostEstimate,
    })

    // Analyze the vehicle image
    const analysisResult = await analyzeVehicle(imageUrl)

    if (!analysisResult.success || !analysisResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vehicle analysis failed',
          details: analysisResult.error,
        },
        { status: 422 },
      )
    }

    let vehicleAnalysis = analysisResult.data
    let serviceRecommendations: string[] = []
    let costEstimate: string | null = null

    // Use explicit provider from analysis result
    const actualProvider = analysisResult.provider === 'BAML' ? 'BAML/OpenAI' : 'FAL AI (Fallback)'

    // Validate and coerce the analysis to stable schema
    if (vehicleAnalysis) {
      try {
        vehicleAnalysis = VehicleAnalysisSchema.parse(vehicleAnalysis)
        console.log('✅ Vehicle analysis validated successfully')
      } catch (validationError) {
        console.warn('⚠️ Vehicle analysis validation failed, using raw data:', validationError)
        // Continue with raw data but log the validation issue
      }
    }

    // Generate service recommendations if requested
    if (shouldGenerateRecommendations) {
      console.log('🔧 Generating service recommendations...')

      const recommendationsResult = await generateServiceRecommendations(
        vehicleAnalysis,
        customerTier,
      )

      if (recommendationsResult.success && recommendationsResult.data) {
        serviceRecommendations = recommendationsResult.data

        // Generate cost estimate if requested and we have damages and recommendations
        if (includeCostEstimate && vehicleAnalysis.damages && vehicleAnalysis.damages.length > 0) {
          console.log('💰 Generating cost estimate...')

          const costResult = await estimateServiceCosts(
            vehicleAnalysis.damages,
            serviceRecommendations,
          )

          if (costResult.success && costResult.data) {
            costEstimate = costResult.data
          } else {
            console.warn('Cost estimation failed:', costResult.error)
          }
        }
      } else {
        console.warn('Service recommendations failed:', recommendationsResult.error)
      }
    }

    // Format response with accurate metadata
    const response = {
      success: true,
      analysis: vehicleAnalysis,
      serviceRecommendations,
      costEstimate,
      metadata: {
        timestamp: new Date().toISOString(),
        customerTier,
        aiProvider: actualProvider,
        analysisValidated: vehicleAnalysis
          ? VehicleAnalysisSchema.safeParse(vehicleAnalysis).success
          : false,
        hasLicensePlate: !!vehicleAnalysis?.license_plate,
        damagesDetected: vehicleAnalysis?.damages?.length || 0,
      },
    }

    console.log('✅ AI Analysis completed successfully')

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ AI Analysis error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'AI analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'Use POST to analyze vehicle images',
      endpoints: {
        'POST /api/v1/ai/analyze-vehicle': {
          description: 'Analyze vehicle image using AI',
          parameters: {
            imageUrl: 'string (required) - URL of the vehicle image',
            customerTier:
              'string (optional) - Customer tier for recommendations (default: standard)',
            generateRecommendations:
              'boolean (optional) - Whether to generate service recommendations (default: false)',
          },
        },
      },
    },
    { status: 405 },
  )
}
