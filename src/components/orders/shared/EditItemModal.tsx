'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Car,
  Droplets,
  Sparkles,
  Shield,
  Zap,
  Star,
  DollarSign,
  Save,
  RotateCcw,
  Check,
} from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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

interface EditItemModalProps {
  item: OrderItem | null
  isOpen: boolean
  onClose: () => void
  onUpdateItem: (itemId: string, updates: Partial<OrderItem>) => void
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

export function EditItemModal({ 
  item, 
  isOpen, 
  onClose, 
  onUpdateItem 
}: EditItemModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [customPrice, setCustomPrice] = useState<string>('')
  const [useCustomPrice, setUseCustomPrice] = useState(false)

  useEffect(() => {
    if (item && isOpen) {
      setSelectedOptions(item.selectedOptions.map(opt => opt.id))
      setCustomPrice(item.customPrice?.toString() || '')
      setUseCustomPrice(!!item.customPrice)
    } else {
      setSelectedOptions([])
      setCustomPrice('')
      setUseCustomPrice(false)
    }
  }, [item, isOpen])

  if (!item) return null

  const Icon = getServiceIcon(item.service.icon)
  const availableOptions = item.service.compatibleOptions || []

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    )
  }

  const calculateOptionsPrice = () => {
    return selectedOptions.reduce((sum, optionId) => {
      const option = availableOptions.find(opt => opt.id === optionId)
      return sum + (option?.additionalPrice || 0)
    }, 0)
  }

  const calculateTotal = () => {
    const servicePrice = useCustomPrice && customPrice 
      ? parseFloat(customPrice) || 0 
      : item.service.basePrice
    return servicePrice + calculateOptionsPrice()
  }

  const handleSave = () => {
    if (!item.id) return

    const selectedOptionObjects = availableOptions.filter(opt => 
      selectedOptions.includes(opt.id)
    )

    const updates: Partial<OrderItem> = {
      selectedOptions: selectedOptionObjects,
      optionsPrice: calculateOptionsPrice(),
    }

    if (useCustomPrice && customPrice) {
      updates.customPrice = parseFloat(customPrice) || 0
    } else {
      updates.customPrice = undefined
    }

    onUpdateItem(item.id, updates)
    onClose()
  }

  const resetToOriginal = () => {
    setSelectedOptions(item.selectedOptions.map(opt => opt.id))
    setCustomPrice(item.customPrice?.toString() || '')
    setUseCustomPrice(!!item.customPrice)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Icon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span>Edit: {item.service.name}</span>
                {item.service.popular && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    <Star className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-400 font-normal">{item.service.category}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Details */}
          <div>
            <p className="text-gray-300 mb-4">{item.service.description}</p>
          </div>

          {/* Price Override */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="useCustomPrice"
                checked={useCustomPrice}
                onChange={(e) => setUseCustomPrice(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <Label htmlFor="useCustomPrice" className="text-white">
                Override service price
              </Label>
            </div>
            
            {useCustomPrice ? (
              <div className="space-y-2">
                <Label className="text-gray-400">Custom Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="Enter custom price..."
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-gray-400">Base Price:</span>
                <span className="text-white font-semibold">
                  {formatCurrency(item.service.basePrice)}
                </span>
              </div>
            )}
          </div>

          {/* Add-on Options */}
          {availableOptions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Add-on Options</h3>
              <div className="space-y-3">
                {availableOptions.map((option) => {
                  const isSelected = selectedOptions.includes(option.id)
                  return (
                    <motion.div
                      key={option.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Card
                        className={cn(
                          'cursor-pointer transition-all border-2',
                          isSelected
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        )}
                        onClick={() => toggleOption(option.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  'w-5 h-5 rounded border-2 flex items-center justify-center',
                                  isSelected 
                                    ? 'border-blue-500 bg-blue-500' 
                                    : 'border-gray-600'
                                )}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-white">{option.name}</h4>
                                  {option.description && (
                                    <p className="text-gray-400 text-sm">{option.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-green-400 font-semibold">
                                +{formatCurrency(option.additionalPrice)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          <Separator className="bg-gray-700" />

          {/* Total and Actions */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Updated Total</p>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(calculateTotal())}
              </p>
              {selectedOptions.length > 0 && (
                <p className="text-gray-500 text-sm">
                  Service: {formatCurrency(useCustomPrice && customPrice ? parseFloat(customPrice) || 0 : item.service.basePrice)} + 
                  Add-ons: {formatCurrency(calculateOptionsPrice())}
                </p>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={resetToOriginal}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
