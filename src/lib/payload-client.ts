import { Order, User, Vehicle, Service, CustomerTier } from '@/payload-types'

const PAYLOAD_API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export interface DashboardStats {
  todayOrders: number
  activeJobs: number
  todayRevenue: number
  avgCompletionTime: number
}

export interface OrderWithRelations extends Omit<Order, 'customer' | 'vehicle'> {
  customer: User
  vehicle: Vehicle
}

class PayloadClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${PAYLOAD_API_URL}/api`
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  // Orders API
  async getOrders(params?: {
    limit?: number
    page?: number
    where?: any
    sort?: string
  }): Promise<{ docs: OrderWithRelations[]; totalDocs: number; totalPages: number }> {
    const searchParams = new URLSearchParams()

    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.sort) searchParams.append('sort', params.sort)
    if (params?.where) searchParams.append('where', JSON.stringify(params.where))

    // Always populate customer and vehicle relations
    searchParams.append('depth', '2')

    const query = searchParams.toString()
    return this.request<{ docs: OrderWithRelations[]; totalDocs: number; totalPages: number }>(
      `/orders${query ? `?${query}` : ''}`,
    )
  }

  async getOrderById(id: string): Promise<OrderWithRelations> {
    return this.request<OrderWithRelations>(`/orders/${id}?depth=2`)
  }

  async createOrder(orderData: Partial<Order>): Promise<OrderWithRelations> {
    return this.request<OrderWithRelations>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
  }

  async updateOrder(id: string, orderData: Partial<Order>): Promise<OrderWithRelations> {
    return this.request<OrderWithRelations>(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(orderData),
    })
  }

  // Users API
  async getUsers(params?: {
    limit?: number
    where?: any
  }): Promise<{ docs: User[]; totalDocs: number }> {
    const searchParams = new URLSearchParams()

    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.where) searchParams.append('where', JSON.stringify(params.where))

    const query = searchParams.toString()
    return this.request<{ docs: User[]; totalDocs: number }>(`/users${query ? `?${query}` : ''}`)
  }

  // Vehicles API
  async getVehicles(params?: {
    limit?: number
    where?: any
  }): Promise<{ docs: Vehicle[]; totalDocs: number }> {
    const searchParams = new URLSearchParams()

    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.where) searchParams.append('where', JSON.stringify(params.where))

    const query = searchParams.toString()
    return this.request<{ docs: Vehicle[]; totalDocs: number }>(
      `/vehicles${query ? `?${query}` : ''}`,
    )
  }

  async getVehicleByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    const result = await this.getVehicles({
      where: { licensePlate: { equals: licensePlate } },
      limit: 1,
    })
    return result.docs[0] || null
  }

  // Services API
  async getServices(params?: {
    limit?: number
    where?: any
  }): Promise<{ docs: Service[]; totalDocs: number }> {
    const searchParams = new URLSearchParams()

    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.where) searchParams.append('where', JSON.stringify(params.where))

    const query = searchParams.toString()
    return this.request<{ docs: Service[]; totalDocs: number }>(
      `/services${query ? `?${query}` : ''}`,
    )
  }

  // Customer Tiers API
  async getCustomerTiers(): Promise<{ docs: CustomerTier[]; totalDocs: number }> {
    return this.request<{ docs: CustomerTier[]; totalDocs: number }>('/customer-tiers')
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get today's date range
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Get today's orders
      const todayOrdersResult = await this.getOrders({
        where: {
          createdAt: {
            greater_than_equal: today.toISOString(),
            less_than: tomorrow.toISOString(),
          },
        },
      })

      // Get active jobs (orders that are not completed or picked up)
      const activeJobsResult = await this.getOrders({
        where: {
          overallStatus: {
            not_in: ['completed', 'picked_up', 'cancelled'],
          },
        },
      })

      // Calculate today's revenue
      const todayRevenue = todayOrdersResult.docs
        .filter((order) => order.paymentStatus === 'paid')
        .reduce((total, order) => total + (order.totalAmount || 0), 0)

      // Calculate average completion time from completed orders
      const completedOrdersResult = await this.getOrders({
        where: {
          overallStatus: {
            in: ['completed', 'picked_up'],
          },
          createdAt: {
            greater_than_equal: today.toISOString(),
            less_than: tomorrow.toISOString(),
          },
        },
      })

      let avgCompletionTime = 0
      if (completedOrdersResult.docs.length > 0) {
        const totalTime = completedOrdersResult.docs.reduce((total, order) => {
          if (order.createdAt && order.updatedAt) {
            const created = new Date(order.createdAt)
            const completed = new Date(order.updatedAt)
            const diffMinutes = Math.floor((completed.getTime() - created.getTime()) / (1000 * 60))
            return total + diffMinutes
          }
          return total
        }, 0)
        avgCompletionTime = Math.round(totalTime / completedOrdersResult.docs.length)
      }

      return {
        todayOrders: todayOrdersResult.totalDocs,
        activeJobs: activeJobsResult.totalDocs,
        todayRevenue,
        avgCompletionTime,
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      // Return default stats if API fails
      return {
        todayOrders: 0,
        activeJobs: 0,
        todayRevenue: 0,
        avgCompletionTime: 0,
      }
    }
  }
}

export const payloadClient = new PayloadClient()
