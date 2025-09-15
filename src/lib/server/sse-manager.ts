interface SSEClient {
  id: string
  controller: ReadableStreamDefaultController<Uint8Array>
  filters: {
    orderID?: string | null
    eventTypes?: string[]
  }
  encoder: TextEncoder
  connectedAt: Date
  lastActivity: Date
  heartbeatInterval?: NodeJS.Timeout
}

interface SSEEvent {
  eventType: string
  data: any
  orderID?: string
  timestamp?: string
}

class SSEManagerClass {
  private clients: Map<string, SSEClient> = new Map()

  /**
   * Add a new SSE client connection
   */
  addClient(
    clientId: string,
    controller: ReadableStreamDefaultController<Uint8Array>,
    filters: { orderID?: string | null; eventTypes?: string[]; encoder: TextEncoder },
  ): void {
    const client: SSEClient = {
      id: clientId,
      controller,
      filters: {
        orderID: filters.orderID,
        eventTypes: filters.eventTypes,
      },
      encoder: filters.encoder,
      connectedAt: new Date(),
      lastActivity: new Date(),
    }

    this.clients.set(clientId, client)
    console.log(`SSE client ${clientId} connected. Active connections: ${this.clients.size}`)
  }

  /**
   * Remove an SSE client connection
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId)
    if (client) {
      // Clear heartbeat interval if exists
      if (client.heartbeatInterval) {
        clearInterval(client.heartbeatInterval)
      }

      // Try to close the controller
      try {
        client.controller.close()
      } catch (error) {
        // Controller might already be closed
        console.error(`Error closing controller for client ${clientId}:`, error)
      }

      this.clients.delete(clientId)
      console.log(`SSE client ${clientId} removed. Active connections: ${this.clients.size}`)
    }
  }

  /**
   * Set heartbeat interval for a client
   */
  setClientInterval(clientId: string, interval: NodeJS.Timeout): void {
    const client = this.clients.get(clientId)
    if (client) {
      client.heartbeatInterval = interval
    }
  }

  /**
   * Broadcast an event to all matching clients
   */
  broadcastEvent(event: SSEEvent): void {
    const eventData = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    }

    const sseMessage = `event: ${event.eventType}\ndata: ${JSON.stringify(eventData)}\n\n`

    // Get clients that match the event criteria
    const matchingClients = Array.from(this.clients.values()).filter((client) =>
      this.clientMatchesEvent(client, event),
    )

    console.log(`Broadcasting ${event.eventType} event to ${matchingClients.length} clients`)

    // Send to matching clients
    matchingClients.forEach((client) => {
      try {
        client.controller.enqueue(client.encoder.encode(sseMessage))
        client.lastActivity = new Date()
      } catch (error) {
        console.error(`Error sending event to client ${client.id}:`, error)
        // Remove client if sending fails
        this.removeClient(client.id)
      }
    })
  }

  /**
   * Broadcast an event to clients subscribed to a specific order
   */
  broadcastToOrder(orderID: string, event: Omit<SSEEvent, 'orderID'>): void {
    this.broadcastEvent({
      ...event,
      orderID,
    })
  }

  /**
   * Get the number of active connections
   */
  getActiveConnections(): number {
    return this.clients.size
  }

  /**
   * Get client connection details for monitoring
   */
  getClientDetails(): Array<{
    id: string
    connectedAt: Date
    lastActivity: Date
    filters: SSEClient['filters']
  }> {
    return Array.from(this.clients.values()).map((client) => ({
      id: client.id,
      connectedAt: client.connectedAt,
      lastActivity: client.lastActivity,
      filters: client.filters,
    }))
  }

  /**
   * Clean up stale connections (older than 5 minutes without activity)
   */
  cleanupStaleConnections(): void {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const staleClients = Array.from(this.clients.values()).filter(
      (client) => client.lastActivity < fiveMinutesAgo,
    )

    staleClients.forEach((client) => {
      console.log(`Removing stale client ${client.id}`)
      this.removeClient(client.id)
    })
  }

  /**
   * Check if a client should receive a specific event
   */
  private clientMatchesEvent(client: SSEClient, event: SSEEvent): boolean {
    // Comment 5: Prevent order-filtered clients from receiving global events without orderID
    if (client.filters.orderID && !event.orderID) return false

    // Check order ID filter
    if (client.filters.orderID && event.orderID && client.filters.orderID !== event.orderID) {
      return false
    }

    // Comment 2: Align eventTypes filter with broadcasted eventType to avoid missed events
    // Normalize event types for backward compatibility
    const normalizeEventType = (eventType: string): string => {
      if (eventType === 'order_stage_change') return 'stage_change'
      return eventType
    }

    // Check event type filter with normalization
    if (client.filters.eventTypes) {
      const normalizedEventType = normalizeEventType(event.eventType)
      const normalizedFilterTypes = client.filters.eventTypes.map(normalizeEventType)
      if (!normalizedFilterTypes.includes(normalizedEventType)) {
        return false
      }
    }

    return true
  }
}

// Export singleton instance
export const SSEManager = new SSEManagerClass()

// Comment 3: Guard the global stale-connection cleanup interval to avoid multiple timers
declare global {
  var __sseCleanupInterval: NodeJS.Timeout | undefined
}

if (!global.__sseCleanupInterval) {
  // Clean up stale connections every 2 minutes
  global.__sseCleanupInterval = setInterval(
    () => {
      SSEManager.cleanupStaleConnections()
    },
    2 * 60 * 1000,
  )
}
