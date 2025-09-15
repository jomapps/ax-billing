import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { VehicleDamageAnalysisService } from '@/lib/whatsapp/vehicle-damage-analysis-service'
import type { VehicleImage } from '@/payload-types'

/**
 * Reanalyze vehicle images that previously failed AI analysis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vehicleId, imageIds } = body

    if (!vehicleId) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 })
    }

    console.log('🔄 Starting vehicle image reanalysis:', {
      vehicleId,
      imageIds: imageIds || 'all failed images',
    })

    const payload = await getPayload({ config })
    const damageAnalysisService = new VehicleDamageAnalysisService()

    // Get vehicle with images
    const vehicle = await payload.findByID({
      collection: 'vehicles',
      id: vehicleId,
      depth: 2,
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Get vehicle images that need reanalysis
    let imagesToReanalyze: VehicleImage[]

    if (imageIds && Array.isArray(imageIds)) {
      // Reanalyze specific images
      const vehicleImages = await payload.find({
        collection: 'vehicle-images',
        where: {
          and: [{ vehicle: { equals: vehicleId } }, { id: { in: imageIds } }],
        },
        depth: 1,
      })
      imagesToReanalyze = vehicleImages.docs
    } else {
      // Reanalyze all images without successful AI analysis
      const vehicleImages = await payload.find({
        collection: 'vehicle-images',
        where: {
          vehicle: { equals: vehicleId },
        },
        depth: 1,
      })
      imagesToReanalyze = vehicleImages.docs
    }

    if (imagesToReanalyze.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No images found that require reanalysis',
        reanalyzedImages: 0,
      })
    }

    console.log(`🔍 Found ${imagesToReanalyze.length} images to reanalyze`)

    const reanalysisResults = []
    let successCount = 0
    let failureCount = 0

    // Reanalyze each image
    for (const vehicleImage of imagesToReanalyze) {
      try {
        console.log(`🔄 Reanalyzing image ${vehicleImage.id} (${vehicleImage.imageType})`)

        const imageUrl = typeof vehicleImage.image === 'object' ? vehicleImage.image.url : ''
        if (!imageUrl) {
          console.error(`❌ No image URL found for vehicle image ${vehicleImage.id}`)
          failureCount++
          continue
        }

        // Perform AI analysis
        const analysisResult = await damageAnalysisService.analyzeVehicleImage(
          imageUrl,
          vehicleImage.imageType,
        )

        if (analysisResult.success) {
          // Update vehicle image with new analysis
          await payload.update({
            collection: 'vehicle-images',
            id: vehicleImage.id,
            data: {
              aiProcessed: true,
              damageDetected: (analysisResult.damageAnalysis?.length || 0) > 0,
              damageDescription:
                analysisResult.damageAnalysis?.map((d) => d.damageDescription).join('; ') || '',
            },
          })

          reanalysisResults.push({
            imageId: vehicleImage.id,
            imageType: vehicleImage.imageType,
            success: true,
            condition: analysisResult.overallCondition,
            damagesFound: analysisResult.damageAnalysis?.length || 0,
          })

          successCount++
          console.log(`✅ Successfully reanalyzed image ${vehicleImage.id}`)
        } else {
          // Update with failure status
          await payload.update({
            collection: 'vehicle-images',
            id: vehicleImage.id,
            data: {
              // Don't update aiAnalysis on failure - leave it empty for retry
              damageDetected: false,
              damageDescription: `Analysis failed: ${analysisResult.error || 'Unknown error'}`,
            },
          })

          reanalysisResults.push({
            imageId: vehicleImage.id,
            imageType: vehicleImage.imageType,
            success: false,
            error: analysisResult.error,
          })

          failureCount++
          console.log(`❌ Failed to reanalyze image ${vehicleImage.id}: ${analysisResult.error}`)
        }
      } catch (error) {
        console.error(`❌ Error reanalyzing image ${vehicleImage.id}:`, error)
        failureCount++

        reanalysisResults.push({
          imageId: vehicleImage.id,
          imageType: vehicleImage.imageType,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    console.log(`✅ Reanalysis completed: ${successCount} success, ${failureCount} failures`)

    return NextResponse.json({
      success: true,
      message: `Reanalyzed ${imagesToReanalyze.length} images`,
      reanalyzedImages: imagesToReanalyze.length,
      successCount,
      failureCount,
      results: reanalysisResults,
    })
  } catch (error) {
    console.error('❌ Vehicle reanalysis error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reanalyze vehicle images',
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
      message: 'Use POST to reanalyze vehicle images',
      endpoints: {
        'POST /api/v1/ai/reanalyze-vehicle': {
          description: 'Reanalyze vehicle images that failed AI analysis',
          parameters: {
            vehicleId: 'string (required) - ID of the vehicle',
            imageIds:
              'string[] (optional) - Specific image IDs to reanalyze. If not provided, all failed images will be reanalyzed',
          },
        },
      },
    },
    { status: 405 },
  )
}
