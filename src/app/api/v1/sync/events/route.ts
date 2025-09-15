import { NextRequest, NextResponse } from 'next/server'
import { SSEManager } from '@/lib/server/sse-manager'

// Comment 1: Explicitly set Node runtime and force dynamic route to ensure SSE works reliably
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url)
    const orderID = searchParams.get('orderID')
    const eventTypesParam = searchParams.get('eventTypes')
    const eventTypes = eventTypesParam ? eventTypesParam.split(',') : undefined

    // Generate unique client ID
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create ReadableStream for SSE
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()

        // Send initial connection event
        const welcomeEvent = `event: connected\ndata: ${JSON.stringify({
          clientId,
          timestamp: new Date().toISOString(),
          message: 'SSE connection established',
        })}\n\n`
        controller.enqueue(encoder.encode(welcomeEvent))

        // Register client with SSE manager
        SSEManager.addClient(clientId, controller, {
          orderID,
          eventTypes,
          encoder,
        })

        // Set up heartbeat interval
        const heartbeatInterval = setInterval(() => {
          try {
            const heartbeatEvent = `event: heartbeat\ndata: ${JSON.stringify({
              timestamp: new Date().toISOString(),
              activeConnections: SSEManager.getActiveConnections(),
            })}\n\n`
            controller.enqueue(encoder.encode(heartbeatEvent))
          } catch (error) {
            console.error('Heartbeat error:', error)
            clearInterval(heartbeatInterval)
            SSEManager.removeClient(clientId)
          }
        }, 30000) // 30 seconds

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          console.log(`SSE client ${clientId} disconnected`)
          clearInterval(heartbeatInterval)
          SSEManager.removeClient(clientId)
          // Don't try to close controller here - it's handled by the stream cleanup
        })

        // Store interval reference for cleanup
        SSEManager.setClientInterval(clientId, heartbeatInterval)
      },

      cancel() {
        console.log(`SSE stream cancelled for client ${clientId}`)
        SSEManager.removeClient(clientId)
      },
    })

    // Return SSE response with proper headers
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Cache-Control, Last-Event-ID',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    })
  } catch (error) {
    console.error('SSE endpoint error:', error)
    return NextResponse.json({ error: 'Failed to establish SSE connection' }, { status: 500 })
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control, Last-Event-ID',
    },
  })
}
