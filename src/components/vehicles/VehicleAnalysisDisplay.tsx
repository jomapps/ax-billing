'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Car, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Ruler, 
  Camera,
  FileText,
  Zap,
  Clock
} from 'lucide-react'

interface VehicleImage {
  id: string
  imageType: string
  image: {
    url: string
    alt: string
  }
  damageDetected: boolean
  damageDescription?: string
  damageConfidence?: number
  aiAnalysis?: {
    vehicleCondition: string
    visibleFeatures: Array<{ feature: string }>
    colorAnalysis: string
    processingTime: number
  }
  vehicleSize?: {
    estimatedLength: number
    estimatedWidth: number
    estimatedHeight: number
    sizeCategory: string
    confidence: number
  }
}

interface Vehicle {
  id: string
  licensePlate: string
  vehicleType: string
  make?: string
  model?: string
  year?: number
  color?: string
  sizeAnalysis?: {
    length: number
    width: number
    height: number
    sizeCategory: string
    confidence: number
  }
  damageAssessment?: {
    intakeDamages?: Array<{
      description: string
      severity: string
      location: string
      confidence: number
    }>
    deliveryDamages?: Array<{
      description: string
      severity: string
      location: string
      isNewDamage: boolean
      confidence: number
    }>
    overallCondition: string
    lastAssessmentDate: string
  }
  vehicleImages?: VehicleImage[]
}

interface VehicleAnalysisDisplayProps {
  vehicle: Vehicle
  showImages?: boolean
  showDamageAnalysis?: boolean
  showSizeAnalysis?: boolean
  className?: string
}

export function VehicleAnalysisDisplay({
  vehicle,
  showImages = true,
  showDamageAnalysis = true,
  showSizeAnalysis = true,
  className = '',
}: VehicleAnalysisDisplayProps) {
  const [selectedImage, setSelectedImage] = useState<VehicleImage | null>(null)

  const getConditionColor = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200'
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'poor': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'damaged': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'minor': return 'bg-yellow-100 text-yellow-800'
      case 'moderate': return 'bg-orange-100 text-orange-800'
      case 'major': return 'bg-red-100 text-red-800'
      case 'severe': return 'bg-red-200 text-red-900'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getImageTypeIcon = (imageType: string) => {
    switch (imageType) {
      case 'front': return '🚗'
      case 'back': return '🚙'
      case 'left': return '🚐'
      case 'right': return '🚚'
      case 'damage': return '⚠️'
      case 'interior': return '🪑'
      case 'license_plate': return '🔢'
      default: return '📷'
    }
  }

  const formatImageType = (imageType: string) => {
    return imageType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Vehicle Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Vehicle Analysis - {vehicle.licensePlate}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Basic Information</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Type:</strong> {vehicle.vehicleType}</p>
                {vehicle.make && <p><strong>Make:</strong> {vehicle.make}</p>}
                {vehicle.model && <p><strong>Model:</strong> {vehicle.model}</p>}
                {vehicle.year && <p><strong>Year:</strong> {vehicle.year}</p>}
                {vehicle.color && <p><strong>Color:</strong> {vehicle.color}</p>}
              </div>
            </div>
            
            {showSizeAnalysis && vehicle.sizeAnalysis && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-1">
                  <Ruler className="w-4 h-4" />
                  Size Analysis
                </h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Length:</strong> {vehicle.sizeAnalysis.length}m</p>
                  <p><strong>Width:</strong> {vehicle.sizeAnalysis.width}m</p>
                  <p><strong>Height:</strong> {vehicle.sizeAnalysis.height}m</p>
                  <p><strong>Category:</strong> {vehicle.sizeAnalysis.sizeCategory}</p>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(vehicle.sizeAnalysis.confidence * 100)}% confidence
                  </Badge>
                </div>
              </div>
            )}
            
            {showDamageAnalysis && vehicle.damageAssessment && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Overall Condition
                </h3>
                <div className="space-y-2">
                  <Badge className={getConditionColor(vehicle.damageAssessment.overallCondition)}>
                    {vehicle.damageAssessment.overallCondition}
                  </Badge>
                  <p className="text-xs text-gray-600">
                    Last assessed: {new Date(vehicle.damageAssessment.lastAssessmentDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Images ({vehicle.vehicleImages?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="damage" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Damage Analysis
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            AI Analysis
          </TabsTrigger>
        </TabsList>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-4">
          {vehicle.vehicleImages && vehicle.vehicleImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {vehicle.vehicleImages.map((vehicleImage) => (
                <Card key={vehicleImage.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="relative">
                      <img
                        src={vehicleImage.image.url}
                        alt={vehicleImage.image.alt}
                        className="w-full h-32 object-cover rounded-lg"
                        onClick={() => setSelectedImage(vehicleImage)}
                      />
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs">
                          {getImageTypeIcon(vehicleImage.imageType)} {formatImageType(vehicleImage.imageType)}
                        </Badge>
                      </div>
                      {vehicleImage.damageDetected && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Damage
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium">{formatImageType(vehicleImage.imageType)}</p>
                      {vehicleImage.aiAnalysis && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Clock className="w-3 h-3" />
                          {vehicleImage.aiAnalysis.processingTime}s
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No images available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Damage Analysis Tab */}
        <TabsContent value="damage" className="space-y-4">
          {vehicle.damageAssessment ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Intake Damages */}
              {vehicle.damageAssessment.intakeDamages && vehicle.damageAssessment.intakeDamages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Intake Damages</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {vehicle.damageAssessment.intakeDamages.map((damage, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={getSeverityColor(damage.severity)}>
                            {damage.severity}
                          </Badge>
                          <span className="text-xs text-gray-600">
                            {Math.round(damage.confidence * 100)}% confidence
                          </span>
                        </div>
                        <p className="text-sm font-medium">{damage.location}</p>
                        <p className="text-sm text-gray-600">{damage.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Delivery Damages */}
              {vehicle.damageAssessment.deliveryDamages && vehicle.damageAssessment.deliveryDamages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Delivery Damages</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {vehicle.damageAssessment.deliveryDamages.map((damage, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getSeverityColor(damage.severity)}>
                              {damage.severity}
                            </Badge>
                            {damage.isNewDamage && (
                              <Badge variant="destructive" className="text-xs">
                                NEW
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-600">
                            {Math.round(damage.confidence * 100)}% confidence
                          </span>
                        </div>
                        <p className="text-sm font-medium">{damage.location}</p>
                        <p className="text-sm text-gray-600">{damage.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No damage assessment available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Analysis Tab */}
        <TabsContent value="ai" className="space-y-4">
          {vehicle.vehicleImages && vehicle.vehicleImages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicle.vehicleImages
                .filter(img => img.aiAnalysis)
                .map((vehicleImage) => (
                  <Card key={vehicleImage.id}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span>{getImageTypeIcon(vehicleImage.imageType)}</span>
                        {formatImageType(vehicleImage.imageType)} Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {vehicleImage.aiAnalysis && (
                        <>
                          <div>
                            <p className="text-sm font-medium">Condition:</p>
                            <Badge className={getConditionColor(vehicleImage.aiAnalysis.vehicleCondition)}>
                              {vehicleImage.aiAnalysis.vehicleCondition}
                            </Badge>
                          </div>
                          
                          {vehicleImage.aiAnalysis.colorAnalysis && (
                            <div>
                              <p className="text-sm font-medium">Color Analysis:</p>
                              <p className="text-sm text-gray-600">{vehicleImage.aiAnalysis.colorAnalysis}</p>
                            </div>
                          )}
                          
                          {vehicleImage.aiAnalysis.visibleFeatures && vehicleImage.aiAnalysis.visibleFeatures.length > 0 && (
                            <div>
                              <p className="text-sm font-medium">Visible Features:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {vehicleImage.aiAnalysis.visibleFeatures.map((feature, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {feature.feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Clock className="w-3 h-3" />
                            Processed in {vehicleImage.aiAnalysis.processingTime}s
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No AI analysis data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {getImageTypeIcon(selectedImage.imageType)} {formatImageType(selectedImage.imageType)}
                </h3>
                <Button onClick={() => setSelectedImage(null)} variant="outline" size="sm">
                  Close
                </Button>
              </div>
              <img
                src={selectedImage.image.url}
                alt={selectedImage.image.alt}
                className="w-full max-h-96 object-contain rounded-lg"
              />
              {selectedImage.damageDetected && selectedImage.damageDescription && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-800">Damage Detected</span>
                  </div>
                  <p className="text-sm text-red-700">{selectedImage.damageDescription}</p>
                  {selectedImage.damageConfidence && (
                    <p className="text-xs text-red-600 mt-1">
                      Confidence: {Math.round(selectedImage.damageConfidence * 100)}%
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
