import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Car, User, Calendar, Palette } from 'lucide-react'
import Image from 'next/image'

interface VehicleData {
  id: string
  licensePlate: string
  vehicleType: string
  make?: string
  model?: string
  year?: number
  color?: string
  image?: {
    url?: string
    thumbnailURL?: string
    alt?: string
  }
  owner?: {
    name?: string
    email?: string
    phone?: string
  }
}

interface VehicleInfoCardProps {
  vehicle: VehicleData
  className?: string
  showOwner?: boolean
}

const vehicleTypeLabels: Record<string, string> = {
  sedan: 'Sedan',
  mpv_van: 'MPV/Van',
  large_pickup: 'Large Pickup',
  regular_bike: 'Regular Bike',
  heavy_bike: 'Heavy Bike',
  very_heavy_bike: 'Very Heavy Bike',
}

const vehicleTypeColors: Record<string, string> = {
  sedan: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  mpv_van: 'bg-green-500/20 text-green-400 border-green-500/30',
  large_pickup: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  regular_bike: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  heavy_bike: 'bg-red-500/20 text-red-400 border-red-500/30',
  very_heavy_bike: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
}

export function VehicleInfoCard({ vehicle, className, showOwner = true }: VehicleInfoCardProps) {
  const imageUrl = vehicle.image?.thumbnailURL || vehicle.image?.url
  const vehicleTypeLabel = vehicleTypeLabels[vehicle.vehicleType] || vehicle.vehicleType
  const vehicleTypeColor = vehicleTypeColors[vehicle.vehicleType] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'

  return (
    <Card className={`bg-gray-800/50 border-gray-700 ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Car className="w-5 h-5 text-blue-400" />
          Vehicle Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vehicle Image and License Plate */}
        <div className="flex gap-4">
          {imageUrl ? (
            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
              <Image
                src={imageUrl}
                alt={vehicle.image?.alt || `Vehicle ${vehicle.licensePlate}`}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
              <Car className="w-8 h-8 text-gray-400" />
            </div>
          )}
          
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="text-xl font-bold text-white">{vehicle.licensePlate}</h3>
              <Badge className={vehicleTypeColor}>
                {vehicleTypeLabel}
              </Badge>
            </div>
            
            {(vehicle.make || vehicle.model) && (
              <p className="text-gray-300">
                {[vehicle.make, vehicle.model].filter(Boolean).join(' ')}
                {vehicle.year && ` (${vehicle.year})`}
              </p>
            )}
            
            {vehicle.color && (
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 capitalize">{vehicle.color}</span>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">License Plate:</span>
            <p className="text-white font-mono">{vehicle.licensePlate}</p>
          </div>
          <div>
            <span className="text-gray-400">Type:</span>
            <p className="text-white">{vehicleTypeLabel}</p>
          </div>
          
          {vehicle.make && (
            <div>
              <span className="text-gray-400">Make:</span>
              <p className="text-white">{vehicle.make}</p>
            </div>
          )}
          
          {vehicle.model && (
            <div>
              <span className="text-gray-400">Model:</span>
              <p className="text-white">{vehicle.model}</p>
            </div>
          )}
          
          {vehicle.year && (
            <div>
              <span className="text-gray-400">Year:</span>
              <p className="text-white">{vehicle.year}</p>
            </div>
          )}
          
          {vehicle.color && (
            <div>
              <span className="text-gray-400">Color:</span>
              <p className="text-white capitalize">{vehicle.color}</p>
            </div>
          )}
        </div>

        {/* Owner Information */}
        {showOwner && vehicle.owner && (
          <>
            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-medium">Owner Information</span>
              </div>
              
              <div className="space-y-2 text-sm">
                {vehicle.owner.name && (
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <p className="text-white">{vehicle.owner.name}</p>
                  </div>
                )}
                
                {vehicle.owner.email && (
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <p className="text-white">{vehicle.owner.email}</p>
                  </div>
                )}
                
                {vehicle.owner.phone && (
                  <div>
                    <span className="text-gray-400">Phone:</span>
                    <p className="text-white">{vehicle.owner.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
