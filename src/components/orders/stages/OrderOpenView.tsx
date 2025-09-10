'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Settings,
  Car,
  Menu,
  Plus,
  Minus,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Package,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { VehicleInfoCard } from '../shared/VehicleInfoCard'
import { ServiceSidebar } from '../shared/ServiceSidebar'
import { ServiceConfigModal } from '../shared/ServiceConfigModal'
import { EditItemModal } from '../shared/EditItemModal'
import { cn, formatCurrency } from '@/lib/utils'

interface Service {
  id: string
  name: string
  description: string
  basePrice: number
  estimatedTime: number
  category: string
  icon: string
  popular?: boolean
  vehicleTypes?: string[]
  compatibleOptions?: ServiceOption[]
}

interface ServiceOption {
  id: string
  name: string
  description?: string
  additionalPrice: number
  icon?: string
}

interface OrderItem {
  id?: string
  service: Service
  selectedOptions: ServiceOption[]
  servicePrice: number
  optionsPrice: number
  customPrice?: number
}

interface CustomerTier {
  id: string
  tierName: string
  defaultQueue: 'regular' | 'vip' | 'remnant'
  discountPercentage: number
}

interface OrderData {
  id: string
  orderID: string
  orderStage: 'empty' | 'initiated' | 'open' | 'billed' | 'paid'
  whatsappLinked?: boolean
  whatsappNumber?: string
  customer?: {
    id: string
    name: string
    email?: string
    phone?: string
    tier?: CustomerTier
  }
  vehicle?: {
    id: string
    licensePlate: string
    vehicleType: string
    make?: string
    model?: string
    year?: number
    color?: string
  }
  servicesRendered?: OrderItem[]
  totalAmount: number
  discountAmount?: number
  paymentStatus: string
  overallStatus: string
  queue: 'regular' | 'vip' | 'remnant'
  createdAt: string
  updatedAt: string
}

interface OrderOpenViewProps {
  orderId: string
  initialOrderData?: OrderData | null
  className?: string
}

export function OrderOpenView({ orderId, initialOrderData, className }: OrderOpenViewProps) {
  const router = useRouter()
  const [orderData, setOrderData] = useState<OrderData | null>(initialOrderData || null)
  const [loading, setLoading] = useState(!initialOrderData)
  const [error, setError] = useState<string | null>(null)

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Data State
  const [services, setServices] = useState<Service[]>([])
  const [customerTiers, setCustomerTiers] = useState<CustomerTier[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])

  useEffect(() => {
    if (!initialOrderData) {
      fetchFullOrderData()
    } else {
      setOrderItems(initialOrderData.servicesRendered || [])
    }
    fetchServices()
    fetchCustomerTiers()
  }, [initialOrderData])

  const fetchFullOrderData = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/orders?where[orderID][equals]=${orderId}&depth=3`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch order data`)
      }

      const data = await response.json()

      if (data.docs && data.docs.length > 0) {
        const order = data.docs[0]
        setOrderData(order)
        setOrderItems(order.servicesRendered || [])
      } else {
        setError(`Order ${orderId} not found.`)
      }
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch order data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load order data.')
      setLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services?depth=2&limit=100')
      if (response.ok) {
        const data = await response.json()
        setServices(data.docs || [])
      }
    } catch (err) {
      console.error('Failed to fetch services:', err)
    }
  }

  const fetchCustomerTiers = async () => {
    try {
      const response = await fetch('/api/customer-tiers?limit=100')
      if (response.ok) {
        const data = await response.json()
        setCustomerTiers(data.docs || [])
      }
    } catch (err) {
      console.error('Failed to fetch customer tiers:', err)
    }
  }

  // Order Management Functions
  const addServiceToOrder = (service: Service, options: ServiceOption[] = []) => {
    const servicePrice = service.basePrice
    const optionsPrice = options.reduce((sum, opt) => sum + opt.additionalPrice, 0)

    const newItem: OrderItem = {
      id: `temp-${Date.now()}`,
      service,
      selectedOptions: options,
      servicePrice,
      optionsPrice,
    }

    setOrderItems((prev) => [...prev, newItem])
    updateOrderTotal([...orderItems, newItem])
  }

  const removeOrderItem = (itemId: string) => {
    const updatedItems = orderItems.filter((item) => item.id !== itemId)
    setOrderItems(updatedItems)
    updateOrderTotal(updatedItems)
  }

  const updateOrderItem = (itemId: string, updates: Partial<OrderItem>) => {
    const updatedItems = orderItems.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item,
    )
    setOrderItems(updatedItems)
    updateOrderTotal(updatedItems)
  }

  const updateOrderTotal = (items: OrderItem[]) => {
    const total = items.reduce((sum, item) => {
      const itemTotal = (item.customPrice ?? item.servicePrice) + item.optionsPrice
      return sum + itemTotal
    }, 0)

    if (orderData) {
      setOrderData((prev) => (prev ? { ...prev, totalAmount: total } : null))
    }
  }

  const calculateRunningTotal = () => {
    return orderItems.reduce((sum, item) => {
      const itemTotal = (item.customPrice ?? item.servicePrice) + item.optionsPrice
      return sum + itemTotal
    }, 0)
  }

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setIsServiceModalOpen(true)
    setIsSidebarOpen(false)
  }

  const handleEditItem = (item: OrderItem) => {
    setEditingItem(item)
    setIsEditModalOpen(true)
  }

  const updateCustomerTier = async (tierId: string) => {
    if (!orderData) return

    try {
      const response = await fetch(`/api/orders/${orderData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            ...orderData.customer,
            tier: tierId,
          },
        }),
      })

      if (response.ok) {
        const updatedOrder = await response.json()
        setOrderData(updatedOrder)
      }
    } catch (err) {
      console.error('Failed to update customer tier:', err)
    }
  }

  const updateQueue = async (queue: 'regular' | 'vip' | 'remnant') => {
    if (!orderData) return

    try {
      const response = await fetch(`/api/orders/${orderData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue }),
      })

      if (response.ok) {
        const updatedOrder = await response.json()
        setOrderData(updatedOrder)
      }
    } catch (err) {
      console.error('Failed to update queue:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-blue-400 animate-spin" />
            <p className="text-gray-300">Loading order...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !orderData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="bg-red-500/10 border-red-500/30 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Order</h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen bg-gray-900', className)}>
      {/* Mobile-responsive layout with sidebar */}
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header with Menu Button */}
          <div className="lg:hidden bg-gray-800 border-b border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className="text-lg font-bold text-white">{orderData.orderID}</h1>
                  <p className="text-xs text-gray-400">Service Management</p>
                </div>
              </div>
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Available Services</SheetTitle>
                  </SheetHeader>
                  <ServiceSidebar
                    services={services}
                    onServiceSelect={handleServiceSelect}
                    vehicleType={orderData.vehicle?.vehicleType}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block bg-gray-800 border-b border-gray-700 p-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-white">{orderData.orderID}</h1>
                  <p className="text-gray-400">Service Selection & Management</p>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Open</Badge>
                <p className="text-sm text-gray-400 mt-1">Services Available</p>
              </div>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto p-4 lg:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Consolidated Order & Vehicle Info */}
              <ConsolidatedOrderHeader
                orderData={orderData}
                customerTiers={customerTiers}
                onTierChange={updateCustomerTier}
                onQueueChange={updateQueue}
              />

              {/* Order Items Management */}
              <OrderItemsSection
                items={orderItems}
                onEditItem={handleEditItem}
                onRemoveItem={removeOrderItem}
                runningTotal={calculateRunningTotal()}
              />
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Available Services</h2>
            <ServiceSidebar
              services={services}
              onServiceSelect={handleServiceSelect}
              vehicleType={orderData.vehicle?.vehicleType}
            />
          </div>
        </div>
      </div>

      {/* Service Configuration Modal */}
      <ServiceConfigModal
        service={selectedService}
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onAddService={addServiceToOrder}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        item={editingItem}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdateItem={updateOrderItem}
      />
    </div>
  )
}

// Sub-components

interface ConsolidatedOrderHeaderProps {
  orderData: OrderData
  customerTiers: CustomerTier[]
  onTierChange: (tierId: string) => void
  onQueueChange: (queue: 'regular' | 'vip' | 'remnant') => void
}

function ConsolidatedOrderHeader({
  orderData,
  customerTiers,
  onTierChange,
  onQueueChange,
}: ConsolidatedOrderHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-4"
    >
      {/* Order Information */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            Order Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Order ID:</span>
              <p className="text-white font-mono">{orderData.orderID}</p>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 ml-2">
                {orderData.orderStage}
              </Badge>
            </div>
            <div>
              <span className="text-gray-400">Customer:</span>
              <p className="text-white">{orderData.customer?.name || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-400">Phone:</span>
              <p className="text-white">{orderData.customer?.phone || 'N/A'}</p>
            </div>
          </div>

          {/* Customer Tier Selection */}
          <div className="space-y-2">
            <Label className="text-gray-400">Customer Classification</Label>
            <Select value={orderData.customer?.tier?.id || ''} onValueChange={onTierChange}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select tier..." />
              </SelectTrigger>
              <SelectContent>
                {customerTiers.map((tier) => (
                  <SelectItem key={tier.id} value={tier.id}>
                    {tier.tierName} ({tier.discountPercentage}% discount)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Queue Assignment */}
          <div className="space-y-2">
            <Label className="text-gray-400">Queue Priority</Label>
            <Select value={orderData.queue} onValueChange={onQueueChange}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="remnant">Remnant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Information */}
      {orderData.vehicle && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-400" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                <Car className="w-8 h-8 text-gray-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{orderData.vehicle.licensePlate}</h3>
                <p className="text-gray-300">
                  {orderData.vehicle.make} {orderData.vehicle.model}
                  {orderData.vehicle.year && ` (${orderData.vehicle.year})`}
                </p>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mt-1">
                  {orderData.vehicle.vehicleType.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Type:</span>
                <p className="text-white capitalize">
                  {orderData.vehicle.vehicleType.replace('_', ' ')}
                </p>
              </div>
              {orderData.vehicle.color && (
                <div>
                  <span className="text-gray-400">Color:</span>
                  <p className="text-white capitalize">{orderData.vehicle.color}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

interface OrderItemsSectionProps {
  items: OrderItem[]
  onEditItem: (item: OrderItem) => void
  onRemoveItem: (itemId: string) => void
  runningTotal: number
}

function OrderItemsSection({
  items,
  onEditItem,
  onRemoveItem,
  runningTotal,
}: OrderItemsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-green-400" />
              Order Items
            </CardTitle>
            <div className="text-right">
              <p className="text-sm text-gray-400">Running Total</p>
              <p className="text-xl font-bold text-green-400">{formatCurrency(runningTotal)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-white mb-2">No Services Added</h3>
              <p className="text-gray-400 mb-6">
                Select services from the sidebar to add them to this order.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Browse available services in the sidebar</p>
                <p>• Configure options and pricing</p>
                <p>• Manage individual service items</p>
                <p>• Track real-time total calculation</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-white">{item.service.name}</h4>
                        {item.service.popular && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            Popular
                          </Badge>
                        )}
                      </div>

                      <p className="text-gray-400 text-sm mb-3">{item.service.description}</p>

                      {item.selectedOptions.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-400 mb-1">Add-ons:</p>
                          <div className="flex flex-wrap gap-2">
                            {item.selectedOptions.map((option) => (
                              <Badge
                                key={option.id}
                                className="bg-blue-500/20 text-blue-400 border-blue-500/30"
                              >
                                {option.name} (+{formatCurrency(option.additionalPrice)})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Service:</span>
                          <span className="text-white ml-1">
                            {formatCurrency(item.customPrice ?? item.servicePrice)}
                            {item.customPrice && (
                              <span className="text-yellow-400 ml-1">(Custom)</span>
                            )}
                          </span>
                        </div>
                        {item.optionsPrice > 0 && (
                          <div>
                            <span className="text-gray-400">Add-ons:</span>
                            <span className="text-white ml-1">
                              {formatCurrency(item.optionsPrice)}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-400">Total:</span>
                          <span className="text-green-400 font-semibold ml-1">
                            {formatCurrency(
                              (item.customPrice ?? item.servicePrice) + item.optionsPrice,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditItem(item)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => item.id && onRemoveItem(item.id)}
                        className="hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
