'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Camera,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Car,
  Eye,
  AlertTriangle,
} from 'lucide-react'

interface CapturedImage {
  id: string
  file: File
  previewUrl: string
  imageType: string
  uploaded: boolean
  processing: boolean
  error?: string
}

interface MultiImageVehicleCaptureInterfaceProps {
  orderId: string
  onVehicleCaptured?: (vehicleInfo: any) => void
  onCancel?: () => void
  className?: string
}

const REQUIRED_IMAGE_TYPES = [
  {
    type: 'front',
    label: 'Front View',
    icon: '🚗',
    description: 'Front of vehicle with license plate',
  },
  {
    type: 'back',
    label: 'Back View',
    icon: '🚙',
    description: 'Rear of vehicle with license plate',
  },
  { type: 'left', label: 'Left Side', icon: '🚐', description: 'Left side of vehicle' },
  { type: 'right', label: 'Right Side', icon: '🚚', description: 'Right side of vehicle' },
]

const OPTIONAL_IMAGE_TYPES = [
  { type: 'damage', label: 'Damage Close-up', icon: '⚠️', description: 'Close-up of any damage' },
  { type: 'interior', label: 'Interior', icon: '🪑', description: 'Interior view' },
  {
    type: 'license_plate',
    label: 'License Plate',
    icon: '🔢',
    description: 'Close-up of license plate',
  },
  { type: 'additional', label: 'Additional', icon: '📷', description: 'Any additional photos' },
]

export function MultiImageVehicleCaptureInterface({
  orderId,
  onVehicleCaptured,
  onCancel,
  className = '',
}: MultiImageVehicleCaptureInterfaceProps) {
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([])
  const [currentImageType, setCurrentImageType] = useState<string>('front')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getRequiredImageProgress = () => {
    const requiredTypes = REQUIRED_IMAGE_TYPES.map((t) => t.type)
    const capturedRequiredTypes = capturedImages
      .filter((img) => requiredTypes.includes(img.imageType))
      .map((img) => img.imageType)
    const uniqueCapturedTypes = [...new Set(capturedRequiredTypes)]
    return (uniqueCapturedTypes.length / requiredTypes.length) * 100
  }

  const isReadyToProcess = () => {
    const requiredTypes = REQUIRED_IMAGE_TYPES.map((t) => t.type)
    const capturedRequiredTypes = capturedImages
      .filter((img) => requiredTypes.includes(img.imageType))
      .map((img) => img.imageType)
    const uniqueCapturedTypes = [...new Set(capturedRequiredTypes)]
    return uniqueCapturedTypes.length === requiredTypes.length
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    const newImage: CapturedImage = {
      id: `${Date.now()}-${Math.random()}`,
      file,
      previewUrl,
      imageType: currentImageType,
      uploaded: false,
      processing: false,
    }

    setCapturedImages((prev) => [...prev, newImage])
    setError(null)

    // Auto-advance to next required type if available
    const nextRequiredType = getNextRequiredType()
    if (nextRequiredType) {
      setCurrentImageType(nextRequiredType)
    }
  }

  const getNextRequiredType = () => {
    const requiredTypes = REQUIRED_IMAGE_TYPES.map((t) => t.type)
    const capturedRequiredTypes = capturedImages
      .filter((img) => requiredTypes.includes(img.imageType))
      .map((img) => img.imageType)
    const uniqueCapturedTypes = [...new Set(capturedRequiredTypes)]

    return requiredTypes.find((type) => !uniqueCapturedTypes.includes(type))
  }

  const removeImage = (imageId: string) => {
    setCapturedImages((prev) => {
      const updated = prev.filter((img) => img.id !== imageId)
      // Clean up preview URL
      const imageToRemove = prev.find((img) => img.id === imageId)
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl)
      }
      return updated
    })
  }

  const processAllImages = async () => {
    if (!isReadyToProcess()) {
      setError('Please capture all required images before processing')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('orderId', orderId)
      formData.append('captureStage', 'intake') // Default to intake

      // Add all images with their types
      capturedImages.forEach((image, index) => {
        formData.append(`image_${index}`, image.file)
        formData.append(`imageType_${index}`, image.imageType)
      })

      formData.append('imageCount', capturedImages.length.toString())

      const response = await fetch('/api/v1/staff/capture-vehicle-multi', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setAnalysisResults(data)
        setSuccess(true)
        setShowResults(true)
        onVehicleCaptured?.(data)
      } else {
        throw new Error(data.error || 'Failed to process vehicle images')
      }
    } catch (error) {
      console.error('Vehicle processing error:', error)
      setError(error instanceof Error ? error.message : 'Failed to process images')
    } finally {
      setIsProcessing(false)
    }
  }

  const getCurrentTypeInfo = () => {
    return [...REQUIRED_IMAGE_TYPES, ...OPTIONAL_IMAGE_TYPES].find(
      (t) => t.type === currentImageType,
    )
  }

  const getImageTypeStatus = (type: string) => {
    const hasImage = capturedImages.some((img) => img.imageType === type)
    const isRequired = REQUIRED_IMAGE_TYPES.some((t) => t.type === type)

    if (hasImage) return 'captured'
    if (isRequired) return 'required'
    return 'optional'
  }

  if (showResults && analysisResults) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            Vehicle Analysis Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Vehicle Information</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>License Plate:</strong> {analysisResults.vehicleNumber || 'Not detected'}
                </p>
                <p>
                  <strong>Overall Condition:</strong>{' '}
                  {analysisResults.overallCondition || 'Unknown'}
                </p>
                <p>
                  <strong>Images Processed:</strong> {analysisResults.processedImages || 0}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Damage Assessment</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Damages Found:</strong> {analysisResults.allDamages?.length || 0}
                </p>
                {analysisResults.allDamages?.slice(0, 3).map((damage: any, index: number) => (
                  <p key={index} className="text-orange-600">
                    • {damage.location}: {damage.damageDescription}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setShowResults(false)} variant="outline" className="sm:w-auto">
              View Details
            </Button>
            <Button
              onClick={onCancel}
              className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial"
            >
              Complete
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Multi-Image Vehicle Capture - Order {orderId}
        </CardTitle>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Required Images Progress</span>
            <span>{Math.round(getRequiredImageProgress())}%</span>
          </div>
          <Progress value={getRequiredImageProgress()} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Type Selection */}
        <div className="space-y-4">
          <h3 className="font-semibold">Required Images (4/4)</h3>
          <div className="grid grid-cols-2 gap-2">
            {REQUIRED_IMAGE_TYPES.map((type) => (
              <Button
                key={type.type}
                variant={currentImageType === type.type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentImageType(type.type)}
                className={`justify-start ${
                  getImageTypeStatus(type.type) === 'captured' ? 'border-green-500 bg-green-50' : ''
                }`}
              >
                <span className="mr-2">{type.icon}</span>
                {type.label}
                {getImageTypeStatus(type.type) === 'captured' && (
                  <CheckCircle className="w-4 h-4 ml-auto text-green-600" />
                )}
              </Button>
            ))}
          </div>

          <h3 className="font-semibold">Optional Images</h3>
          <div className="grid grid-cols-2 gap-2">
            {OPTIONAL_IMAGE_TYPES.map((type) => (
              <Button
                key={type.type}
                variant={currentImageType === type.type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentImageType(type.type)}
                className={`justify-start ${
                  getImageTypeStatus(type.type) === 'captured' ? 'border-green-500 bg-green-50' : ''
                }`}
              >
                <span className="mr-2">{type.icon}</span>
                {type.label}
                {getImageTypeStatus(type.type) === 'captured' && (
                  <CheckCircle className="w-4 h-4 ml-auto text-green-600" />
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Current Image Type Info */}
        {getCurrentTypeInfo() && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getCurrentTypeInfo()?.icon}</span>
              <strong>{getCurrentTypeInfo()?.label}</strong>
            </div>
            <p className="text-sm text-gray-600">{getCurrentTypeInfo()?.description}</p>
          </div>
        )}

        {/* Image Capture Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
              disabled={isProcessing}
            >
              <Camera className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Capture {getCurrentTypeInfo()?.label}</span>
              <span className="sm:hidden">Capture</span>
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              disabled={isProcessing}
              className="sm:w-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Captured Images Grid */}
        {capturedImages.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Captured Images ({capturedImages.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {capturedImages.map((image) => (
                <div key={image.id} className="relative">
                  <img
                    src={image.previewUrl}
                    alt={`${image.imageType} view`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <div className="absolute top-1 left-1">
                    <Badge variant="secondary" className="text-xs">
                      {REQUIRED_IMAGE_TYPES.find((t) => t.type === image.imageType)?.label ||
                        OPTIONAL_IMAGE_TYPES.find((t) => t.type === image.imageType)?.label ||
                        image.imageType}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => removeImage(image.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={processAllImages}
            disabled={!isReadyToProcess() || isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">
                  Processing {capturedImages.length} Images...
                </span>
                <span className="sm:hidden">Processing...</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">
                  Analyze Vehicle ({capturedImages.length} images)
                </span>
                <span className="sm:hidden">Analyze Vehicle</span>
              </>
            )}
          </Button>
          <Button onClick={onCancel} variant="outline" className="sm:w-auto">
            Cancel
          </Button>
        </div>

        {/* Progress Indicator */}
        {!isReadyToProcess() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">
                Please capture all 4 required images before processing
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
