import { NextRequest, NextResponse } from 'next/server'
import { QRCodeService } from '@/lib/whatsapp/qr-service'

const qrService = new QRCodeService()

export async function POST(request: NextRequest) {
  try {
    const { orderId, staffId, location, customMessage } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Generate WhatsApp link with order ID
    const whatsappLink = await qrService.generateTrackedQR(
      orderId,
      staffId,
      location,
      customMessage
    )

    return NextResponse.json({
      success: true,
      qrValue: whatsappLink,
      orderId,
      message: 'QR code generated successfully',
    })
  } catch (error) {
    console.error('QR code generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate QR code',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (orderId) {
      // Get QR status for specific order
      const status = await qrService.getQRStatus(orderId)
      return NextResponse.json({
        success: true,
        orderId,
        ...status,
      })
    } else {
      // Generate basic WhatsApp link without order ID (fallback)
      const qrValue = qrService.generateWhatsAppLink()
      return NextResponse.json({
        success: true,
        qrValue,
        message: 'Basic QR code generated',
      })
    }
  } catch (error) {
    console.error('QR code generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate QR code',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
