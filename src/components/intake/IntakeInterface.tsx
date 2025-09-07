'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Camera,
  Upload,
  X,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Save,
  Eye,
  RotateCcw,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface IntakeInterfaceProps {
  orderId: string
  onComplete?: (intakeData: any) => void
  onCancel?: () => void
  className?: string
}

interface VehicleImage {
  file: File
  preview: string
  angle: string
  description?: string
}

interface DamageItem {
  type: string
  location: string
  severity: string
  description: string
  images: File[]
}

const VEHICLE_ANGLES = [
  { value: 'front', label: 'Front' },
  { value: 'rear', label: 'Rear' },
  { value: 'left', label: 'Left Side' },
  { value: 'right', label: 'Right Side' },
  { value: 'front_left', label: 'Front Left' },
  { value: 'front_right', label: 'Front Right' },
  { value: 'rear_left', label: 'Rear Left' },
  { value: 'rear_right', label: 'Rear Right' },
  { value: 'interior', label: 'Interior' },
  { value: 'engine', label: 'Engine Bay' },
]

const DAMAGE_TYPES = [
  { value: 'scratch', label: 'Scratch' },
  { value: 'dent', label: 'Dent' },
  { value: 'crack', label: 'Crack' },
  { value: 'rust', label: 'Rust' },
  { value: 'paint_damage', label: 'Paint Damage' },
  { value: 'broken_part', label: 'Broken Part' },
  { value: 'missing_part', label: 'Missing Part' },
  { value: 'other', label: 'Other' },
]

const SEVERITY_LEVELS = [
  { value: 'minor', label: 'Minor' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'major', label: 'Major' },
  { value: 'severe', label: 'Severe' },
]

const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]

export function IntakeInterface({
  orderId,
  onComplete,
  onCancel,
  className,
}: IntakeInterfaceProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [numberplateImage, setNumberplateImage] = useState<File | null>(null)
  const [numberplatePreview, setNumberplatePreview] = useState<string | null>(null)
  const [vehicleImages, setVehicleImages] = useState<VehicleImage[]>([])
  const [overallCondition, setOverallCondition] = useState<string>('')
  const [damageItems, setDamageItems] = useState<DamageItem[]>([])
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const numberplateInputRef = useRef<HTMLInputElement>(null)
  const vehicleImageInputRef = useRef<HTMLInputElement>(null)

  const handleNumberplateImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setNumberplateImage(file)
      const preview = URL.createObjectURL(file)
      setNumberplatePreview(preview)
    }
  }

  const handleVehicleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    files.forEach((file) => {
      const preview = URL.createObjectURL(file)
      setVehicleImages((prev) => [
        ...prev,
        {
          file,
          preview,
          angle: '',
          description: '',
        },
      ])
    })
  }

  const removeVehicleImage = (index: number) => {
    setVehicleImages((prev) => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }

  const updateVehicleImageAngle = (index: number, angle: string) => {
    setVehicleImages((prev) => {
      const newImages = [...prev]
      newImages[index].angle = angle
      return newImages
    })
  }

  const updateVehicleImageDescription = (index: number, description: string) => {
    setVehicleImages((prev) => {
      const newImages = [...prev]
      newImages[index].description = description
      return newImages
    })
  }

  const addDamageItem = () => {
    setDamageItems((prev) => [
      ...prev,
      {
        type: '',
        location: '',
        severity: '',
        description: '',
        images: [],
      },
    ])
  }

  const removeDamageItem = (index: number) => {
    setDamageItems((prev) => {
      const newItems = [...prev]
      newItems.splice(index, 1)
      return newItems
    })
  }

  const updateDamageItem = (index: number, field: keyof DamageItem, value: any) => {
    setDamageItems((prev) => {
      const newItems = [...prev]
      newItems[index] = { ...newItems[index], [field]: value }
      return newItems
    })
  }

  const canProceedToStep2 = () => {
    return numberplateImage && vehicleImages.length > 0
  }

  const canProceedToStep3 = () => {
    return vehicleImages.every((img) => img.angle) && overallCondition
  }

  const canSubmit = () => {
    return (
      numberplateImage &&
      vehicleImages.length > 0 &&
      vehicleImages.every((img) => img.angle) &&
      overallCondition &&
      damageItems.every((item) => item.type && item.location && item.severity)
    )
  }

  const handleSubmit = async () => {
    if (!canSubmit()) return

    setIsSubmitting(true)
    try {
      // TODO: Implement actual submission to API
      const intakeData = {
        orderId,
        numberplateImage,
        vehicleImages,
        damageAssessment: {
          overallCondition,
          existingDamage: damageItems,
          notes: additionalNotes,
        },
      }

      console.log('Submitting intake data:', intakeData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      onComplete?.(intakeData)
    } catch (error) {
      console.error('Failed to submit intake:', error)
      alert('Failed to submit intake. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Step 1: Capture Images</h3>
        <p className="text-gray-400 mb-6">
          Take clear photos of the vehicle's numberplate and multiple angles for damage assessment.
        </p>
      </div>

      {/* Numberplate Image */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            Numberplate Image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {numberplatePreview ? (
              <div className="relative">
                <img
                  src={numberplatePreview}
                  alt="Numberplate"
                  className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-600"
                />
                <Button
                  onClick={() => {
                    setNumberplateImage(null)
                    setNumberplatePreview(null)
                  }}
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => numberplateInputRef.current?.click()}
                className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
              >
                <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400 mb-2">Click to capture numberplate image</p>
                <p className="text-gray-500 text-sm">Clear, well-lit photo for AI extraction</p>
              </div>
            )}
            <input
              ref={numberplateInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleNumberplateImageSelect}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Images */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-green-400" />
            Vehicle Images ({vehicleImages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={() => vehicleImageInputRef.current?.click()}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              <Upload className="w-4 h-4 mr-2" />
              Add Vehicle Images
            </Button>
            <input
              ref={vehicleImageInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleVehicleImageSelect}
              className="hidden"
            />

            {vehicleImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vehicleImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image.preview}
                      alt={`Vehicle ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-600"
                    />
                    <Button
                      onClick={() => removeVehicleImage(index)}
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    {image.angle && (
                      <Badge className="absolute bottom-1 left-1 bg-blue-500">
                        {VEHICLE_ANGLES.find((a) => a.value === image.angle)?.label}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button onClick={onCancel} variant="outline" className="border-gray-600 text-gray-300">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          onClick={() => setCurrentStep(2)}
          disabled={!canProceedToStep2()}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Next: Configure Images
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Step 2: Configure Images</h3>
        <p className="text-gray-400 mb-6">
          Assign angles to each vehicle image and set overall condition.
        </p>
      </div>

      {/* Vehicle Images Configuration */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Configure Vehicle Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {vehicleImages.map((image, index) => (
              <div key={index} className="border border-gray-600 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <img
                      src={image.preview}
                      alt={`Vehicle ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-white">Image Angle *</Label>
                      <Select
                        value={image.angle}
                        onValueChange={(value) => updateVehicleImageAngle(index, value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select angle" />
                        </SelectTrigger>
                        <SelectContent>
                          {VEHICLE_ANGLES.map((angle) => (
                            <SelectItem key={angle.value} value={angle.value}>
                              {angle.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-white">Description</Label>
                    <Input
                      value={image.description}
                      onChange={(e) => updateVehicleImageDescription(index, e.target.value)}
                      placeholder="Optional description"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overall Condition */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Overall Vehicle Condition</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={overallCondition} onValueChange={setOverallCondition}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Select overall condition" />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_OPTIONS.map((condition) => (
                <SelectItem key={condition.value} value={condition.value}>
                  {condition.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          onClick={() => setCurrentStep(1)}
          variant="outline"
          className="border-gray-600 text-gray-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={() => setCurrentStep(3)}
          disabled={!canProceedToStep3()}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Next: Damage Assessment
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Step 3: Damage Assessment</h3>
        <p className="text-gray-400 mb-6">
          Document any existing damage found during intake inspection.
        </p>
      </div>

      {/* Existing Damage */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Existing Damage</CardTitle>
            <Button onClick={addDamageItem} className="bg-green-500 hover:bg-green-600">
              Add Damage Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {damageItems.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <p className="text-gray-400">No damage items added</p>
              <p className="text-gray-500 text-sm">
                Click "Add Damage Item" if any damage is found
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {damageItems.map((item, index) => (
                <div key={index} className="border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-white">Damage Item {index + 1}</h4>
                    <Button onClick={() => removeDamageItem(index)} variant="destructive" size="sm">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Damage Type *</Label>
                      <Select
                        value={item.type}
                        onValueChange={(value) => updateDamageItem(index, 'type', value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select damage type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DAMAGE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white">Location *</Label>
                      <Input
                        value={item.location}
                        onChange={(e) => updateDamageItem(index, 'location', e.target.value)}
                        placeholder="e.g., Front bumper, Left door"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Severity *</Label>
                      <Select
                        value={item.severity}
                        onValueChange={(value) => updateDamageItem(index, 'severity', value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          {SEVERITY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white">Description</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateDamageItem(index, 'description', e.target.value)}
                        placeholder="Detailed description of the damage"
                        className="bg-gray-700 border-gray-600 text-white"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Any additional observations or notes about the vehicle condition"
            className="bg-gray-700 border-gray-600 text-white"
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          onClick={() => setCurrentStep(2)}
          variant="outline"
          className="border-gray-600 text-gray-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit() || isSubmitting}
          className="bg-green-500 hover:bg-green-600"
        >
          {isSubmitting ? (
            <>
              <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Complete Intake
            </>
          )}
        </Button>
      </div>
    </div>
  )

  return (
    <div className={cn('container mx-auto p-6', className)}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Vehicle Intake</h1>
        <p className="text-gray-400">Order: {orderId}</p>
      </motion.div>

      {/* Progress Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
                  currentStep >= step
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-400 border border-gray-600',
                )}
              >
                {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
              </div>
              {step < 3 && (
                <div
                  className={cn(
                    'w-16 h-1 mx-2',
                    currentStep > step ? 'bg-blue-500' : 'bg-gray-700',
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-4 space-x-16">
          <span className={cn('text-sm', currentStep >= 1 ? 'text-blue-400' : 'text-gray-400')}>
            Capture Images
          </span>
          <span className={cn('text-sm', currentStep >= 2 ? 'text-blue-400' : 'text-gray-400')}>
            Configure
          </span>
          <span className={cn('text-sm', currentStep >= 3 ? 'text-blue-400' : 'text-gray-400')}>
            Assessment
          </span>
        </div>
      </motion.div>

      {/* Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </motion.div>
    </div>
  )
}
