'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Camera, Upload, Loader2, CheckCircle, AlertCircle, Edit } from 'lucide-react'

interface VehicleCaptureInterfaceProps {
  orderId: string
  onVehicleCaptured?: (vehicleInfo: any) => void
  onClose?: () => void
  className?: string
}

interface VehicleInfo {
  vehicleType: string
  licensePlate: string
  confidence: number
}

export function VehicleCaptureInterface({ 
  orderId, 
  onVehicleCaptured,
  onClose,
  className = '' 
}: VehicleCaptureInterfaceProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiResult, setAiResult] = useState<VehicleInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualData, setManualData] = useState({
    licensePlate: '',
    vehicleType: ''
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const vehicleTypes = [
    { value: 'sedan', label: 'Sedan' },
    { value: 'suv', label: 'SUV' },
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'mpv', label: 'MPV' },
    { value: 'pickup', label: 'Pickup Truck' },
    { value: 'motorcycle', label: 'Motorcycle' },
    { value: 'heavy_bike', label: 'Heavy Bike' },
    { value: 'van', label: 'Van' },
    { value: 'truck', label: 'Truck' },
  ]

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError(null)
      setAiResult(null)
      setSuccess(false)
    }
  }

  const handleCameraCapture = () => {
    fileInputRef.current?.click()
  }

  const processVehicleImage = async () => {
    if (!selectedFile) {
      setError('Please select an image first')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('orderId', orderId)
      formData.append('image', selectedFile)

      const response = await fetch('/api/staff/capture-vehicle', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setAiResult(data.vehicleInfo)
        setSuccess(true)
        onVehicleCaptured?.(data)
      } else if (response.status === 422 && data.requiresManualInput) {
        // AI processing failed, show manual input
        setShowManualInput(true)
        setError('AI processing failed. Please enter vehicle information manually.')
      } else {
        throw new Error(data.error || 'Failed to process vehicle image')
      }
    } catch (error) {
      console.error('Vehicle processing error:', error)
      setError(error instanceof Error ? error.message : 'Failed to process vehicle image')
      setShowManualInput(true)
    } finally {
      setIsProcessing(false)
    }
  }

  const submitManualData = async () => {
    if (!manualData.licensePlate || !manualData.vehicleType) {
      setError('Please fill in all required fields')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('orderId', orderId)
      formData.append('licensePlate', manualData.licensePlate)
      formData.append('vehicleType', manualData.vehicleType)
      formData.append('useManualData', 'true')
      
      if (selectedFile) {
        formData.append('image', selectedFile)
      }

      const response = await fetch('/api/staff/capture-vehicle', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setAiResult(data.vehicleInfo)
        setSuccess(true)
        onVehicleCaptured?.(data)
      } else {
        throw new Error(data.error || 'Failed to save vehicle information')
      }
    } catch (error) {
      console.error('Manual vehicle submission error:', error)
      setError(error instanceof Error ? error.message : 'Failed to save vehicle information')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setAiResult(null)
    setError(null)
    setSuccess(false)
    setShowManualInput(false)
    setManualData({ licensePlate: '', vehicleType: '' })
  }

  if (success && aiResult) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            Vehicle Captured Successfully
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-lg font-semibold">Order: {orderId}</p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span>Vehicle Type:</span>
                <Badge variant="secondary">{aiResult.vehicleType}</Badge>
              </div>
              <div className="flex justify-between">
                <span>License Plate:</span>
                <Badge variant="outline" className="font-mono">{aiResult.licensePlate}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Confidence:</span>
                <Badge variant={aiResult.confidence > 0.8 ? 'default' : 'secondary'}>
                  {Math.round(aiResult.confidence * 100)}%
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={resetForm} variant="outline" className="flex-1">
              Capture Another
            </Button>
            <Button onClick={onClose} className="flex-1">
              Done
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
          Capture Vehicle - Order {orderId}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Capture Section */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleCameraCapture}
              variant="outline"
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
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

          {previewUrl && (
            <div className="relative">
              <img 
                src={previewUrl} 
                alt="Vehicle preview" 
                className="w-full max-h-64 object-contain rounded-lg border"
              />
            </div>
          )}
        </div>

        {/* AI Processing or Manual Input */}
        {!showManualInput ? (
          <div className="space-y-4">
            <Button 
              onClick={processVehicleImage}
              disabled={!selectedFile || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing with AI...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Process Vehicle Image
                </>
              )}
            </Button>

            <Button 
              onClick={() => setShowManualInput(true)}
              variant="outline"
              className="w-full"
            >
              <Edit className="w-4 h-4 mr-2" />
              Enter Manually
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="licensePlate">License Plate *</Label>
              <Input
                id="licensePlate"
                value={manualData.licensePlate}
                onChange={(e) => setManualData(prev => ({ ...prev, licensePlate: e.target.value }))}
                placeholder="Enter license plate number"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type *</Label>
              <Select 
                value={manualData.vehicleType} 
                onValueChange={(value) => setManualData(prev => ({ ...prev, vehicleType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => setShowManualInput(false)}
                variant="outline"
                className="flex-1"
              >
                Back to AI
              </Button>
              <Button 
                onClick={submitManualData}
                disabled={isProcessing || !manualData.licensePlate || !manualData.vehicleType}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Vehicle Info'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Close Button */}
        {onClose && (
          <Button onClick={onClose} variant="ghost" className="w-full">
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
