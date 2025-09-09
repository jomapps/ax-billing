'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Car,
  Droplets,
  Sparkles,
  Shield,
  Zap,
  Plus,
  Minus,
  Check,
  Clock,
  DollarSign,
  Package,
  Star,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn, formatCurrency } from '@/lib/utils'
import { payloadClient } from '@/lib/payload-client'

interface Service {
  id: string
  name: string
  description: string
  basePrice: number
  estimatedTime: number // in minutes
  category: string
  icon: string
  popular?: boolean
  vehicleTypes?: string[]
}

interface ServicePackage {
  id: string
  name: string
  description: string
  services: string[]
  originalPrice: number
  packagePrice: number
  savings: number
  popular?: boolean
}

interface ServiceSelectionGridProps {
  orderId: string
  vehicleType?: string
  onServicesSelected: (services: string[], total: number) => void
  onBack?: () => void
  className?: string
}

export function ServiceSelectionGrid({
  orderId,
  vehicleType = 'sedan',
  onServicesSelected,
  onBack,
  className = '',
}: ServiceSelectionGridProps) {
  const [services, setServices] = useState<Service[]>([])
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'services' | 'packages'>('packages')

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockServices: Service[] = [
      {
        id: 'basic-wash',
        name: 'Basic Wash',
        description: 'Exterior wash with soap and rinse',
        basePrice: 15,
        estimatedTime: 15,
        category: 'wash',
        icon: 'droplets',
        vehicleTypes: ['sedan', 'mpv_van', 'large_pickup'],
      },
      {
        id: 'premium-wash',
        name: 'Premium Wash',
        description: 'Exterior wash with premium soap and wax',
        basePrice: 25,
        estimatedTime: 25,
        category: 'wash',
        icon: 'sparkles',
        popular: true,
        vehicleTypes: ['sedan', 'mpv_van', 'large_pickup'],
      },
      {
        id: 'interior-clean',
        name: 'Interior Cleaning',
        description: 'Vacuum and interior surface cleaning',
        basePrice: 20,
        estimatedTime: 20,
        category: 'interior',
        icon: 'car',
        vehicleTypes: ['sedan', 'mpv_van', 'large_pickup'],
      },
      {
        id: 'wax-protection',
        name: 'Wax Protection',
        description: 'Premium wax coating for paint protection',
        basePrice: 30,
        estimatedTime: 30,
        category: 'protection',
        icon: 'shield',
        vehicleTypes: ['sedan', 'mpv_van', 'large_pickup'],
      },
      {
        id: 'express-wash',
        name: 'Express Wash',
        description: 'Quick exterior wash for bikes',
        basePrice: 8,
        estimatedTime: 10,
        category: 'wash',
        icon: 'zap',
        vehicleTypes: ['regular_bike', 'heavy_bike', 'very_heavy_bike'],
      },
      {
        id: 'bike-detail',
        name: 'Bike Detailing',
        description: 'Complete bike cleaning and polishing',
        basePrice: 15,
        estimatedTime: 20,
        category: 'detail',
        icon: 'sparkles',
        popular: true,
        vehicleTypes: ['regular_bike', 'heavy_bike', 'very_heavy_bike'],
      },
    ]

    const mockPackages: ServicePackage[] = [
      {
        id: 'basic-package',
        name: 'Basic Package',
        description: 'Essential cleaning for your vehicle',
        services: ['basic-wash'],
        originalPrice: 15,
        packagePrice: 15,
        savings: 0,
      },
      {
        id: 'premium-package',
        name: 'Premium Package',
        description: 'Complete wash with interior cleaning',
        services: ['premium-wash', 'interior-clean'],
        originalPrice: 45,
        packagePrice: 40,
        savings: 5,
        popular: true,
      },
      {
        id: 'deluxe-package',
        name: 'Deluxe Package',
        description: 'Full service with protection',
        services: ['premium-wash', 'interior-clean', 'wax-protection'],
        originalPrice: 75,
        packagePrice: 65,
        savings: 10,
      },
      {
        id: 'bike-express',
        name: 'Bike Express',
        description: 'Quick bike cleaning',
        services: ['express-wash'],
        originalPrice: 8,
        packagePrice: 8,
        savings: 0,
      },
      {
        id: 'bike-premium',
        name: 'Bike Premium',
        description: 'Complete bike care',
        services: ['bike-detail'],
        originalPrice: 15,
        packagePrice: 15,
        savings: 0,
        popular: true,
      },
    ]

    // Filter services and packages by vehicle type
    const filteredServices = mockServices.filter(
      (service) => !service.vehicleTypes || service.vehicleTypes.includes(vehicleType),
    )

    const filteredPackages = mockPackages.filter((pkg) => {
      const packageServices = pkg.services
        .map((serviceId) => mockServices.find((s) => s.id === serviceId))
        .filter(Boolean)

      return packageServices.every(
        (service) => !service?.vehicleTypes || service.vehicleTypes.includes(vehicleType),
      )
    })

    setServices(filteredServices)
    setPackages(filteredPackages)
    setLoading(false)
  }, [vehicleType])

  const getServiceIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      droplets: Droplets,
      sparkles: Sparkles,
      car: Car,
      shield: Shield,
      zap: Zap,
    }
    return icons[iconName] || Car
  }

  const toggleService = (serviceId: string) => {
    if (selectedPackage) {
      setSelectedPackage(null)
    }

    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    )
  }

  const selectPackage = (packageId: string) => {
    const pkg = packages.find((p) => p.id === packageId)
    if (pkg) {
      setSelectedPackage(packageId)
      setSelectedServices(pkg.services)
    }
  }

  const calculateTotal = () => {
    if (selectedPackage) {
      const pkg = packages.find((p) => p.id === selectedPackage)
      return pkg?.packagePrice || 0
    }

    return selectedServices.reduce((total, serviceId) => {
      const service = services.find((s) => s.id === serviceId)
      return total + (service?.basePrice || 0)
    }, 0)
  }

  const calculateEstimatedTime = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find((s) => s.id === serviceId)
      return total + (service?.estimatedTime || 0)
    }, 0)
  }

  const handleConfirmSelection = () => {
    const total = calculateTotal()
    onServicesSelected(selectedServices, total)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Car className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-400" />
          <p className="text-gray-400">Loading services...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Select Services</h2>
          <p className="text-gray-400">
            Order: {orderId} • Vehicle: {vehicleType}
          </p>
        </div>

        {onBack && (
          <Button onClick={onBack} variant="outline" className="border-gray-600 text-gray-300">
            Back
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('packages')}
          className={cn(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            activeTab === 'packages'
              ? 'bg-blue-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700',
          )}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Packages
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={cn(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            activeTab === 'services'
              ? 'bg-blue-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700',
          )}
        >
          <Car className="w-4 h-4 inline mr-2" />
          Individual Services
        </button>
      </div>

      {/* Package Selection */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <motion.div key={pkg.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card
                className={cn(
                  'cursor-pointer transition-all border-2',
                  selectedPackage === pkg.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600',
                )}
                onClick={() => selectPackage(pkg.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-responsive-lg">{pkg.name}</CardTitle>
                    {pkg.popular && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-responsive-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">{pkg.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {pkg.services.map((serviceId) => {
                      const service = services.find((s) => s.id === serviceId)
                      if (!service) return null

                      const Icon = getServiceIcon(service.icon)
                      return (
                        <div key={serviceId} className="flex items-center gap-2 text-sm">
                          <Icon className="w-4 h-4 text-blue-400" />
                          <span className="text-gray-300">{service.name}</span>
                        </div>
                      )
                    })}
                  </div>

                  <Separator className="bg-gray-700" />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Original Price:</span>
                      <span className="text-gray-400 line-through text-sm">
                        {formatCurrency(pkg.originalPrice)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Package Price:</span>
                      <span className="text-green-400 font-bold text-lg">
                        {formatCurrency(pkg.packagePrice)}
                      </span>
                    </div>

                    {pkg.savings > 0 && (
                      <div className="text-center">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Save {formatCurrency(pkg.savings)}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {selectedPackage === pkg.id && (
                    <div className="flex items-center justify-center pt-2">
                      <Check className="w-5 h-5 text-blue-400" />
                      <span className="text-blue-400 ml-2 font-medium">Selected</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Individual Service Selection */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => {
            const Icon = getServiceIcon(service.icon)
            const isSelected = selectedServices.includes(service.id)

            return (
              <motion.div key={service.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card
                  className={cn(
                    'cursor-pointer transition-all border-2',
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600',
                  )}
                  onClick={() => toggleService(service.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <Icon className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">{service.name}</CardTitle>
                          {service.popular && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 mt-1">
                              <Star className="w-3 h-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-green-400 font-bold text-responsive-lg">
                          {formatCurrency(service.basePrice)}
                        </div>
                        <div className="text-gray-400 text-responsive-sm flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {service.estimatedTime}m
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 text-responsive-sm mb-3">{service.description}</p>

                    {isSelected && (
                      <div className="flex items-center justify-center pt-2">
                        <Check className="w-5 h-5 text-blue-400" />
                        <span className="text-blue-400 ml-2 font-medium text-responsive-sm">
                          Selected
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Selection Summary */}
      {(selectedServices.length > 0 || selectedPackage) && (
        <Card className="bg-gray-800/50 border-gray-700 sticky bottom-4">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-responsive-lg mb-2">Order Summary</h3>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-300 text-responsive-sm">
                    <Car className="w-4 h-4" />
                    <span>{selectedServices.length} service(s) selected</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300 text-responsive-sm">
                    <Clock className="w-4 h-4" />
                    <span>Est. {calculateEstimatedTime()} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-400 font-semibold text-responsive-sm">
                    <DollarSign className="w-4 h-4" />
                    <span>Total: {formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setSelectedServices([])
                    setSelectedPackage(null)
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300"
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleConfirmSelection}
                  className="bg-green-500 hover:bg-green-600 text-white px-8"
                  size="lg"
                >
                  Confirm Services
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
