'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Car, 
  User, 
  CreditCard, 
  Clock, 
  Plus,
  Minus,
  Camera,
  Search
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency, generateOrderId } from '@/lib/utils'

const orderSchema = z.object({
  licensePlate: z.string().min(1, 'License plate is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().optional(),
  vehicleType: z.enum(['sedan', 'mpv_van', 'large_pickup', 'regular_bike', 'heavy_bike', 'very_heavy_bike']),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  paymentMethod: z.enum(['cash', 'online']),
  queue: z.enum(['regular', 'vip', 'remnant']),
})

type OrderFormData = z.infer<typeof orderSchema>

interface Service {
  id: string
  name: string
  basePrice: number
  estimatedMinutes: number
  category: string
  icon: string
}

interface ServiceOption {
  id: string
  name: string
  additionalPrice: number
  icon: string
}

const mockServices: Service[] = [
  {
    id: '1',
    name: 'Basic Wash',
    basePrice: 15.00,
    estimatedMinutes: 20,
    category: 'Exterior',
    icon: 'car'
  },
  {
    id: '2',
    name: 'Premium Wash',
    basePrice: 25.00,
    estimatedMinutes: 35,
    category: 'Exterior',
    icon: 'sparkles'
  },
  {
    id: '3',
    name: 'Interior Clean',
    basePrice: 20.00,
    estimatedMinutes: 30,
    category: 'Interior',
    icon: 'vacuum'
  },
  {
    id: '4',
    name: 'Full Detail',
    basePrice: 45.00,
    estimatedMinutes: 60,
    category: 'Complete',
    icon: 'star'
  }
]

const mockOptions: ServiceOption[] = [
  { id: '1', name: 'Tire Shine', additionalPrice: 5.00, icon: 'circle' },
  { id: '2', name: 'Wax Coating', additionalPrice: 10.00, icon: 'shield' },
  { id: '3', name: 'Air Freshener', additionalPrice: 3.00, icon: 'wind' },
]

export function NewOrderForm({ onClose }: { onClose?: () => void }) {
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [vehicleImage, setVehicleImage] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      queue: 'regular',
      paymentMethod: 'cash',
      services: [],
    }
  })

  const watchedServices = watch('services')
  const watchedVehicleType = watch('vehicleType')

  const calculateTotal = () => {
    const serviceTotal = selectedServices.reduce((total, serviceId) => {
      const service = mockServices.find(s => s.id === serviceId)
      return total + (service?.basePrice || 0)
    }, 0)

    const optionsTotal = selectedOptions.reduce((total, optionId) => {
      const option = mockOptions.find(o => o.id === optionId)
      return total + (option?.additionalPrice || 0)
    }, 0)

    return serviceTotal + optionsTotal
  }

  const calculateEstimatedTime = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = mockServices.find(s => s.id === serviceId)
      return total + (service?.estimatedMinutes || 0)
    }, 0)
  }

  const toggleService = (serviceId: string) => {
    const newServices = selectedServices.includes(serviceId)
      ? selectedServices.filter(id => id !== serviceId)
      : [...selectedServices, serviceId]
    
    setSelectedServices(newServices)
    setValue('services', newServices)
  }

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    )
  }

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true)
    try {
      // TODO: Submit to API
      console.log('Order data:', {
        ...data,
        selectedOptions,
        vehicleImage,
        orderId: generateOrderId(),
        totalAmount: calculateTotal(),
        estimatedTime: calculateEstimatedTime(),
      })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert('Order created successfully!')
      onClose?.()
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-gaming font-bold text-primary-400 mb-2">
          NEW ORDER
        </h1>
        <p className="text-gray-400">Create a new carwash service order</p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Vehicle Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="gaming">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">License Plate</label>
                  <div className="relative">
                    <Input
                      variant="gaming"
                      placeholder="ABC123"
                      {...register('licensePlate')}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  {errors.licensePlate && (
                    <p className="text-red-400 text-sm mt-1">{errors.licensePlate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Vehicle Type</label>
                  <select
                    {...register('vehicleType')}
                    className="w-full h-12 px-4 py-3 rounded-lg border border-primary-500/30 bg-dark-900/80 text-white focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                  >
                    <option value="">Select vehicle type</option>
                    <option value="sedan">Sedan</option>
                    <option value="mpv_van">MPV/Van</option>
                    <option value="large_pickup">Large Pickup</option>
                    <option value="regular_bike">Regular Bike</option>
                    <option value="heavy_bike">Heavy Bike</option>
                    <option value="very_heavy_bike">Very Heavy Bike</option>
                  </select>
                  {errors.vehicleType && (
                    <p className="text-red-400 text-sm mt-1">{errors.vehicleType.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Vehicle Photo (Optional)</label>
                <div className="border-2 border-dashed border-primary-500/30 rounded-lg p-6 text-center hover:border-primary-500/50 transition-colors">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 mb-2">Take a photo for AI classification</p>
                  <Button type="button" variant="outline" size="sm">
                    <Camera className="w-4 h-4 mr-2" />
                    Capture Photo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Customer Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="gaming">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Customer Name</label>
                  <Input
                    variant="gaming"
                    placeholder="John Doe"
                    {...register('customerName')}
                  />
                  {errors.customerName && (
                    <p className="text-red-400 text-sm mt-1">{errors.customerName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number (Optional)</label>
                  <Input
                    variant="gaming"
                    placeholder="+60123456789"
                    {...register('customerPhone')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Services Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="gaming">
            <CardHeader>
              <CardTitle>Select Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {mockServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105",
                      selectedServices.includes(service.id)
                        ? "border-primary-400 bg-primary-500/10"
                        : "border-gray-600 hover:border-primary-500/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{service.name}</h3>
                      <Badge variant="gaming">{service.category}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>{formatCurrency(service.basePrice)}</span>
                      <span>{service.estimatedMinutes}min</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Service Options */}
              {selectedServices.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Add-on Options</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {mockOptions.map((option) => (
                      <div
                        key={option.id}
                        onClick={() => toggleOption(option.id)}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all",
                          selectedOptions.includes(option.id)
                            ? "border-secondary-400 bg-secondary-500/10"
                            : "border-gray-600 hover:border-secondary-500/50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{option.name}</span>
                          <span className="text-sm text-secondary-400">
                            +{formatCurrency(option.additionalPrice)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Summary & Payment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="gaming">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Method</label>
                  <select
                    {...register('paymentMethod')}
                    className="w-full h-12 px-4 py-3 rounded-lg border border-primary-500/30 bg-dark-900/80 text-white focus:border-primary-400"
                  >
                    <option value="cash">Cash Payment</option>
                    <option value="online">Online Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Queue Priority</label>
                  <select
                    {...register('queue')}
                    className="w-full h-12 px-4 py-3 rounded-lg border border-primary-500/30 bg-dark-900/80 text-white focus:border-primary-400"
                  >
                    <option value="regular">Regular</option>
                    <option value="vip">VIP (+RM5)</option>
                    <option value="remnant">Remnant (-RM3)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-center">
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Total Amount</p>
                    <p className="text-2xl font-bold text-accent-400">
                      {formatCurrency(calculateTotal())}
                    </p>
                    <p className="text-xs text-gray-400">
                      Est. {calculateEstimatedTime()}min
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting || selectedServices.length === 0}
                >
                  {isSubmitting ? (
                    <div className="loading-spinner w-4 h-4 mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {isSubmitting ? 'Creating Order...' : 'Create Order'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </form>
    </div>
  )
}
