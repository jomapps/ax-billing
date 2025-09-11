import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { VehicleDamageAnalysisService } from '@/lib/whatsapp/vehicle-damage-analysis-service'
import { VehicleProcessingService } from '@/lib/whatsapp/vehicle-processing-service'

const damageAnalysisService = new VehicleDamageAnalysisService()
const vehicleService = new VehicleProcessingService()

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const formData = await request.formData()

    const orderId = formData.get('orderId') as string
    const captureStage = formData.get('captureStage') as string || 'intake'
    const imageCount = parseInt(formData.get('imageCount') as string || '0')

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    if (imageCount < 4) {
      return NextResponse.json({ 
        error: 'Minimum 4 images required (front, back, left, right)' 
      }, { status: 400 })
    }

    console.log('🚗 Starting multi-image vehicle capture:', {
      orderId,
      captureStage,
      imageCount,
    })

    // Get order and customer information
    const orders = await payload.find({
      collection: 'orders',
      where: {
        orderID: {
          equals: orderId,
        },
      },
      depth: 2,
    })

    if (!orders.docs || orders.docs.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orders.docs[0]
    const customer = order.customer

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found for this order' }, { status: 404 })
    }

    // Process all images
    const vehicleImages: Array<{ id: string; imageUrl: string; imageType: string }> = []
    const uploadedImages: any[] = []

    for (let i = 0; i < imageCount; i++) {
      const image = formData.get(`image_${i}`) as File
      const imageType = formData.get(`imageType_${i}`) as string

      if (!image || !imageType) {
        console.warn(`Missing image or type for index ${i}`)
        continue
      }

      try {
        // Upload image to media collection
        const imageBuffer = Buffer.from(await image.arrayBuffer())
        
        const mediaResult = await payload.create({
          collection: 'media',
          data: {
            alt: `Vehicle ${imageType} view - Order ${orderId}`,
            caption: `${imageType} view captured during ${captureStage}`,
            category: 'vehicle',
          },
          file: {
            data: imageBuffer,
            mimetype: image.type,
            name: `vehicle-${orderId}-${imageType}-${Date.now()}.jpg`,
            size: imageBuffer.length,
          },
        })

        // Construct the full public URL
        const publicBucketUrl = process.env.S3_PUBLIC_BUCKET || 'https://media.ft.tc'
        const filename = mediaResult.filename || `vehicle-${orderId}-${imageType}-${Date.now()}.jpg`
        
        let imageUrl: string
        if (mediaResult.url && mediaResult.url.startsWith('http')) {
          imageUrl = mediaResult.url
        } else {
          imageUrl = `${publicBucketUrl}/media/${filename}`
        }

        vehicleImages.push({
          id: mediaResult.id,
          imageUrl,
          imageType,
        })

        uploadedImages.push({
          mediaId: mediaResult.id,
          imageType,
          imageUrl,
        })

        console.log(`✅ Uploaded ${imageType} image:`, {
          mediaId: mediaResult.id,
          imageUrl,
        })
      } catch (uploadError) {
        console.error(`❌ Failed to upload ${imageType} image:`, uploadError)
        return NextResponse.json({
          error: `Failed to upload ${imageType} image`,
          details: uploadError instanceof Error ? uploadError.message : 'Unknown error',
        }, { status: 500 })
      }
    }

    if (vehicleImages.length === 0) {
      return NextResponse.json({ error: 'No images were successfully uploaded' }, { status: 400 })
    }

    console.log('🔍 Starting AI analysis of vehicle images:', {
      imageCount: vehicleImages.length,
      imageTypes: vehicleImages.map(img => img.imageType),
    })

    // Analyze all images with AI
    const analysisResult = await damageAnalysisService.analyzeMultipleImages(vehicleImages)

    if (!analysisResult.success) {
      console.error('❌ AI analysis failed:', analysisResult.error)
      return NextResponse.json({
        error: 'AI analysis failed',
        details: analysisResult.error,
        uploadedImages,
      }, { status: 422 })
    }

    console.log('✅ AI analysis completed:', {
      vehicleNumber: analysisResult.vehicleNumber,
      damagesFound: analysisResult.allDamages?.length || 0,
      overallCondition: analysisResult.overallCondition,
    })

    // Create or update vehicle record
    const customerId = typeof customer === 'string' ? customer : customer.id
    let vehicle: any

    if (analysisResult.vehicleNumber) {
      // Try to find existing vehicle by license plate
      const existingVehicles = await payload.find({
        collection: 'vehicles',
        where: {
          licensePlate: {
            equals: analysisResult.vehicleNumber,
          },
        },
      })

      if (existingVehicles.docs && existingVehicles.docs.length > 0) {
        vehicle = existingVehicles.docs[0]
        console.log('📋 Found existing vehicle:', vehicle.id)
      }
    }

    if (!vehicle) {
      // Create new vehicle
      const vehicleData: any = {
        licensePlate: analysisResult.vehicleNumber || `UNKNOWN-${orderId}`,
        vehicleType: 'sedan', // Default, will be updated by AI
        owner: customerId,
        aiClassificationConfidence: 0.8,
      }

      // Add size analysis if available
      if (analysisResult.consolidatedSizeAnalysis) {
        vehicleData.sizeAnalysis = {
          length: analysisResult.consolidatedSizeAnalysis.estimatedLength,
          width: analysisResult.consolidatedSizeAnalysis.estimatedWidth,
          height: analysisResult.consolidatedSizeAnalysis.estimatedHeight,
          sizeCategory: analysisResult.consolidatedSizeAnalysis.sizeCategory,
          confidence: analysisResult.consolidatedSizeAnalysis.confidence,
        }
      }

      // Add damage assessment
      if (analysisResult.allDamages && analysisResult.allDamages.length > 0) {
        const damageField = captureStage === 'intake' ? 'intakeDamages' : 'deliveryDamages'
        vehicleData.damageAssessment = {
          [damageField]: analysisResult.allDamages.map(damage => ({
            description: damage.damageDescription || 'Damage detected',
            severity: damage.severity,
            location: damage.location,
            confidence: damage.confidence,
          })),
          overallCondition: analysisResult.overallCondition,
          lastAssessmentDate: new Date().toISOString(),
        }
      }

      vehicle = await payload.create({
        collection: 'vehicles',
        data: vehicleData,
      })

      console.log('🆕 Created new vehicle:', vehicle.id)
    } else {
      // Update existing vehicle with new analysis
      const updateData: any = {}

      // Update size analysis if available
      if (analysisResult.consolidatedSizeAnalysis) {
        updateData.sizeAnalysis = {
          length: analysisResult.consolidatedSizeAnalysis.estimatedLength,
          width: analysisResult.consolidatedSizeAnalysis.estimatedWidth,
          height: analysisResult.consolidatedSizeAnalysis.estimatedHeight,
          sizeCategory: analysisResult.consolidatedSizeAnalysis.sizeCategory,
          confidence: analysisResult.consolidatedSizeAnalysis.confidence,
        }
      }

      // Update damage assessment
      if (analysisResult.allDamages && analysisResult.allDamages.length > 0) {
        const damageField = captureStage === 'intake' ? 'intakeDamages' : 'deliveryDamages'
        const existingDamageAssessment = vehicle.damageAssessment || {}
        
        updateData.damageAssessment = {
          ...existingDamageAssessment,
          [damageField]: analysisResult.allDamages.map(damage => ({
            description: damage.damageDescription || 'Damage detected',
            severity: damage.severity,
            location: damage.location,
            confidence: damage.confidence,
          })),
          overallCondition: analysisResult.overallCondition,
          lastAssessmentDate: new Date().toISOString(),
        }
      }

      if (Object.keys(updateData).length > 0) {
        vehicle = await payload.update({
          collection: 'vehicles',
          id: vehicle.id,
          data: updateData,
        })
        console.log('📝 Updated existing vehicle:', vehicle.id)
      }
    }

    // Create vehicle image records
    const createdVehicleImages = []
    for (const uploadedImage of uploadedImages) {
      const imageAnalysis = analysisResult.imageAnalyses?.[uploadedImage.mediaId]
      
      const vehicleImageData: any = {
        vehicle: vehicle.id,
        order: order.id,
        image: uploadedImage.mediaId,
        imageType: uploadedImage.imageType,
        captureStage,
        aiProcessed: !!imageAnalysis?.success,
        damageDetected: imageAnalysis?.damageAnalysis && imageAnalysis.damageAnalysis.length > 0,
        extractedText: imageAnalysis?.extractedText,
      }

      // Add damage information if detected
      if (imageAnalysis?.damageAnalysis && imageAnalysis.damageAnalysis.length > 0) {
        const primaryDamage = imageAnalysis.damageAnalysis[0]
        vehicleImageData.damageDescription = primaryDamage.damageDescription
        vehicleImageData.damageConfidence = primaryDamage.confidence
      }

      // Add size analysis if available
      if (imageAnalysis?.sizeAnalysis) {
        vehicleImageData.vehicleSize = {
          estimatedLength: imageAnalysis.sizeAnalysis.estimatedLength,
          estimatedWidth: imageAnalysis.sizeAnalysis.estimatedWidth,
          estimatedHeight: imageAnalysis.sizeAnalysis.estimatedHeight,
          sizeCategory: imageAnalysis.sizeAnalysis.sizeCategory,
          confidence: imageAnalysis.sizeAnalysis.confidence,
        }
      }

      // Add AI analysis results
      if (imageAnalysis) {
        vehicleImageData.aiAnalysis = {
          vehicleCondition: imageAnalysis.overallCondition,
          visibleFeatures: imageAnalysis.visibleFeatures?.map(feature => ({ feature })) || [],
          colorAnalysis: imageAnalysis.colorAnalysis,
          processingTime: imageAnalysis.processingTime,
          rawAiResponse: imageAnalysis.rawAiResponse,
        }
      }

      const vehicleImage = await payload.create({
        collection: 'vehicle-images',
        data: vehicleImageData,
      })

      createdVehicleImages.push(vehicleImage)
    }

    // Update order with vehicle information
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        vehicle: vehicle.id,
        vehicleCapturedAt: new Date().toISOString(),
        aiProcessedAt: new Date().toISOString(),
      },
    })

    console.log('✅ Multi-image vehicle capture completed:', {
      orderId,
      vehicleId: vehicle.id,
      imagesProcessed: createdVehicleImages.length,
      damagesFound: analysisResult.allDamages?.length || 0,
    })

    return NextResponse.json({
      success: true,
      vehicle,
      vehicleImages: createdVehicleImages,
      analysisResult,
      vehicleNumber: analysisResult.vehicleNumber,
      overallCondition: analysisResult.overallCondition,
      allDamages: analysisResult.allDamages,
      processedImages: createdVehicleImages.length,
      message: `Successfully processed ${createdVehicleImages.length} vehicle images`,
    })

  } catch (error) {
    console.error('❌ Multi-image vehicle capture error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process vehicle images',
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
      message: 'Use POST to capture multiple vehicle images',
    },
    { status: 405 },
  )
}
