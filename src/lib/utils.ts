import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'MYR'): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

export function formatTimeAgo(timestamp: number | string | Date): string {
  const now = new Date().getTime()
  const time = new Date(timestamp).getTime()
  const diffInMinutes = Math.floor((now - time) / (1000 * 60))

  if (diffInMinutes < 1) {
    return 'Just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInMinutes < 1440) {
    // 24 hours
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours}h ago`
  } else {
    const days = Math.floor(diffInMinutes / 1440)
    return `${days}d ago`
  }
}

export function generateOrderId(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, '0')
  return `AX-${dateStr}-${random}`
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    pending: 'text-yellow-400',
    in_progress: 'text-blue-400',
    completed: 'text-green-400',
    ready: 'text-purple-400',
    picked_up: 'text-gray-400',
    cancelled: 'text-red-400',
    paid: 'text-green-400',
    failed: 'text-red-400',
    cash: 'text-orange-400',
  }
  return statusColors[status] || 'text-gray-400'
}

export function getQueueColor(queue: string): string {
  const queueColors: Record<string, string> = {
    regular: 'text-blue-400',
    vip: 'text-purple-400',
    remnant: 'text-orange-400',
  }
  return queueColors[queue] || 'text-gray-400'
}

export function calculateEstimatedTime(services: any[]): number {
  return services.reduce((total, service) => {
    return total + (service.estimatedMinutes || 0)
  }, 0)
}

export function getVehicleTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    sedan: 'Sedan',
    mpv_van: 'MPV/Van',
    large_pickup: 'Large Pickup',
    regular_bike: 'Regular Bike',
    heavy_bike: 'Heavy Bike',
    very_heavy_bike: 'Very Heavy Bike',
  }
  return labels[type] || type
}

/**
 * Format date consistently for SSR/client hydration
 * Uses ISO format to avoid locale/timezone mismatches
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

/**
 * Format date for display with consistent formatting
 * Avoids hydration mismatches by using a fixed format
 */
export function formatDisplayDate(date: string | Date): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return `${day}/${month}/${year}, ${hours}:${minutes}`
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Maps order stages to their corresponding URLs
 */
export function getStageUrl(orderId: string, stage: string): string {
  const stageUrlMap: Record<string, string> = {
    empty: `/order/${orderId}/new`,
    initiated: `/order/${orderId}/initiated`,
    open: `/order/${orderId}/open`,
    billed: `/order/${orderId}/billed`,
    paid: `/order/${orderId}/paid`,
  }

  return stageUrlMap[stage] || `/order/${orderId}/new`
}

/**
 * Validates if a stage name is valid
 */
export function isValidStage(stage: string): boolean {
  const validStages = ['empty', 'initiated', 'open', 'billed', 'paid']
  return validStages.includes(stage)
}

/**
 * Gets display name for order stages
 */
export function getStageDisplayName(stage: string): string {
  const stageDisplayNames: Record<string, string> = {
    empty: 'New Order',
    initiated: 'Order Initiated',
    open: 'Order Open',
    billed: 'Order Billed',
    paid: 'Order Paid',
  }

  return stageDisplayNames[stage] || stage
}
