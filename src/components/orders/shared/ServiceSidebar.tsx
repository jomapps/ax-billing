'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Car,
  Droplets,
  Sparkles,
  Shield,
  Zap,
  Star,
  Clock,
  DollarSign,
  Search,
  Filter,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

interface ServiceSidebarProps {
  services: Service[]
  onServiceSelect: (service: Service) => void
  vehicleType?: string
  className?: string
}

const getServiceIcon = (iconName: string) => {
  const icons: Record<string, React.ComponentType<any>> = {
    car: Car,
    droplets: Droplets,
    sparkles: Sparkles,
    shield: Shield,
    zap: Zap,
    star: Star,
  }
  return icons[iconName] || Car
}

export function ServiceSidebar({ 
  services, 
  onServiceSelect, 
  vehicleType,
  className 
}: ServiceSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showPopularOnly, setShowPopularOnly] = useState(false)

  // Filter services based on vehicle type, search, category, and popularity
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      // Vehicle type filter
      if (vehicleType && service.vehicleTypes && service.vehicleTypes.length > 0) {
        if (!service.vehicleTypes.includes(vehicleType)) {
          return false
        }
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        if (!service.name.toLowerCase().includes(searchLower) && 
            !service.description.toLowerCase().includes(searchLower)) {
          return false
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && service.category !== selectedCategory) {
        return false
      }

      // Popular filter
      if (showPopularOnly && !service.popular) {
        return false
      }

      return true
    })
  }, [services, vehicleType, searchTerm, selectedCategory, showPopularOnly])

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(services.map(s => s.category)))
    return cats.sort()
  }, [services])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-700 border-gray-600 text-white"
          />
        </div>

        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="flex-1 bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={showPopularOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPopularOnly(!showPopularOnly)}
            className="border-gray-600"
          >
            <Star className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Vehicle Type Info */}
      {vehicleType && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <p className="text-blue-400 text-sm">
            <Car className="w-4 h-4 inline mr-2" />
            Showing services for: <span className="font-semibold capitalize">
              {vehicleType.replace('_', ' ')}
            </span>
          </p>
        </div>
      )}

      {/* Services List */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {filteredServices.length === 0 ? (
          <div className="text-center py-8">
            <Filter className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-400">No services found</p>
            <p className="text-gray-500 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          filteredServices.map((service) => {
            const Icon = getServiceIcon(service.icon)
            return (
              <motion.div
                key={service.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="cursor-pointer transition-all border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-700/50"
                  onClick={() => onServiceSelect(service)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                        <Icon className="w-5 h-5 text-blue-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white text-sm truncate">
                            {service.name}
                          </h4>
                          {service.popular && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                          {service.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-green-400">
                              <DollarSign className="w-3 h-3" />
                              <span className="font-semibold">
                                {formatCurrency(service.basePrice)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>{service.estimatedTime}m</span>
                            </div>
                          </div>
                          
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                            {service.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Summary */}
      <div className="border-t border-gray-700 pt-3">
        <p className="text-gray-400 text-sm text-center">
          {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} available
        </p>
      </div>
    </div>
  )
}
