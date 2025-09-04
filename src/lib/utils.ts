import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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

export function generateOrderId(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
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

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
