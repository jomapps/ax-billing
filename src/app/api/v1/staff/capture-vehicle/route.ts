import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { VehicleProcessingService } from '@/lib/whatsapp/vehicle-processing-service'
import { WhatsAppService } from '@/lib/whatsapp/whatsapp-service'
import multer from 'multer'
import { promisify } from 'util'

const vehicleService = new VehicleProcessingService()
const whatsappService = new WhatsAppService()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})

const uploadMiddleware = promisify(upload.single('image'))

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const formData = await request.formData()

    const orderId = formData.get('orderId') as string
    const image = formData.get('image') as File
    const manualLicensePlate = formData.get('licensePlate') as string
    const manualVehicleType = formData.get('vehicleType') as string
    const useManualData = formData.get('useManualData') === 'true'

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    if (!image && !useManualData) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 })
    }

    // Get the order
    const orderResult = await payload.find({
      collection: 'orders',
      where: {
        orderID: {
          equals: orderId,
        },
      },
      limit: 1,
      depth: 2,
    })

    if (orderResult.docs.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orderResult.docs[0]
    const customer = order.customer

    if (!customer || typeof customer === 'string') {
      return NextResponse.json({ error: 'Order has no associated customer' }, { status: 400 })
    }

    let vehicleInfo
    let imageUrl = ''
    let mediaResult: any = null

    if (useManualData && manualLicensePlate && manualVehicleType) {
      // Use manual data
      vehicleInfo = {
        licensePlate: manualLicensePlate,
        vehicleType: manualVehicleType,
        confidence: 1.0,
      }
    } else if (image) {
      // Upload image to storage first
      const imageBuffer = Buffer.from(await image.arrayBuffer())

      // Create a media record in Payload using the correct v3 pattern
      const mediaResult = await payload.create({
        collection: 'media',
        data: {
          alt: `Vehicle photo for order ${orderId}`,
          category: 'vehicle',
        },
        file: {
          data: imageBuffer,
          mimetype: image.type,
          name: `vehicle-${orderId}-${Date.now()}.jpg`,
          size: imageBuffer.length,
        },
      })

      // Construct the full public URL for Fal.ai access
      const publicBucketUrl = process.env.S3_PUBLIC_BUCKET || 'https://media.ft.tc'
      const filename = mediaResult.filename || `vehicle-${orderId}-${Date.now()}.jpg`

      // Ensure we have the full public URL that Fal.ai can access
      if (mediaResult.url && mediaResult.url.startsWith('http')) {
        // Already a full URL
        imageUrl = mediaResult.url
      } else {
        // Construct full URL using public bucket URL and filename
        imageUrl = `${publicBucketUrl}/media/${filename}`
      }

      console.log('🔍 Processing vehicle image with Fal.ai:', {
        orderId,
        imageUrl,
        filename: mediaResult.filename,
        mediaResultUrl: mediaResult.url,
      })

      // Process with AI
      const aiResult = await vehicleService.processVehiclePhoto(imageUrl)

      if (!aiResult.success || !aiResult.vehicleInfo) {
        return NextResponse.json(
          {
            success: false,
            error: 'AI processing failed',
            details: aiResult.error,
            imageUrl,
            requiresManualInput: true,
          },
          { status: 422 },
        )
      }

      vehicleInfo = aiResult.vehicleInfo
    } else {
      return NextResponse.json(
        { error: 'Either image or manual data is required' },
        { status: 400 },
      )
    }

    // Create or update vehicle record
    // Ensure we have a valid customer ID (string format for PayloadCMS relationships)
    const customerId = typeof customer === 'string' ? customer : customer.id
    console.log('🔍 Customer ID for vehicle creation:', {
      customerId,
      customerType: typeof customer,
    })

    const vehicle = await vehicleService.createOrUpdateVehicle(
      vehicleInfo,
      customerId,
      mediaResult?.id, // Use optional chaining for manual data case
    )

    // Link vehicle to order and update stage
    const updatedOrder = await vehicleService.linkVehicleToOrder(vehicle.id, orderId)

    // Send WhatsApp notification to customer
    const vehicleMessage = `📸 *Vehicle Information Captured*

Order ID: *${orderId}*
Vehicle: ${vehicleInfo.vehicleType}
License Plate: *${vehicleInfo.licensePlate}*

Our team is now selecting the appropriate services for your vehicle. You'll receive an update shortly!`

    if (order.whatsappNumber) {
      await whatsappService.sendMessage(order.whatsappNumber, vehicleMessage)

      // Log the message
      await payload.create({
        collection: 'whatsapp-messages',
        data: {
          user: customer.id,
          order: order.id,
          whatsappNumber: order.whatsappNumber,
          messageId: `vehicle_captured_${Date.now()}`,
          direction: 'outbound',
          messageType: 'text',
          content: vehicleMessage,
          status: 'sent',
          timestamp: new Date().toISOString(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      vehicleInfo,
      vehicle: {
        id: vehicle.id,
        licensePlate: vehicle.licensePlate,
        vehicleType: vehicle.vehicleType,
      },
      order: {
        id: updatedOrder.id,
        orderID: updatedOrder.orderID,
        orderStage: updatedOrder.orderStage,
      },
      imageUrl,
      message: 'Vehicle information captured successfully',
    })
  } catch (error) {
    console.error('Vehicle capture error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to capture vehicle information',
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
      message: 'Use POST to capture vehicle information',
    },
    { status: 405 },
  )
}
