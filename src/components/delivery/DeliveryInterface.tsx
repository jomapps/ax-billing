'use client'

import { useState, useRef, useEffect } from 'react'
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
  Battery,
  Gauge,
  Settings,
  AlertCircle,
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
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  compareDamageImages,
  generateDamageReport,
  type DamageComparisonResult,
} from '@/lib/damage-comparison'

interface DeliveryInterfaceProps {
  orderId: string
  intakeId?: string
  onComplete?: (deliveryData: any) => void
  onCancel?: () => void
  className?: string
}

interface DeliveryImage {
  file: File
  preview: string
  angle: string
  description?: string
}

interface NewDamageItem {
  type: string
  location: string
  severity: string
  description: string
  images: File[]
  likelyDuringService: boolean
}

interface VehicleInspection {
  batteryStatus: string
  tyreCondition: {
    frontLeft: string
    frontRight: string
    rearLeft: string
    rearRight: string
  }
  tyrePressure: {
    frontLeft: number
    frontRight: number
    rearLeft: number
    rearRight: number
  }
  engineStatus: string
  rimCondition: {
    frontLeft: string
    frontRight: string
    rearLeft: string
    rearRight: string
  }
  recommendations: Array<{
    category: string
    priority: string
    description: string
    estimatedCost?: number
  }>
  overallNotes: string
}

const DELIVERY_ANGLES = [
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
  { value: 'damage_detail', label: 'Damage Detail' },
]

const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'needs_replacement', label: 'Needs Replacement' },
  { value: 'needs_service', label: 'Needs Service' },
  { value: 'not_checked', label: 'Not Checked' },
  { value: 'damaged', label: 'Damaged' },
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

const RECOMMENDATION_CATEGORIES = [
  { value: 'battery', label: 'Battery' },
  { value: 'tyres', label: 'Tyres' },
  { value: 'engine', label: 'Engine' },
  { value: 'rims', label: 'Rims' },
  { value: 'brakes', label: 'Brakes' },
  { value: 'fluids', label: 'Fluids' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'body_work', label: 'Body Work' },
  { value: 'other', label: 'Other' },
]

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export function DeliveryInterface({
  orderId,
  intakeId,
  onComplete,
  onCancel,
  className,
}: DeliveryInterfaceProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [deliveryImages, setDeliveryImages] = useState<DeliveryImage[]>([])
  const [vehicleInspection, setVehicleInspection] = useState<VehicleInspection>({
    batteryStatus: '',
    tyreCondition: {
      frontLeft: '',
      frontRight: '',
      rearLeft: '',
      rearRight: '',
    },
    tyrePressure: {
      frontLeft: 0,
      frontRight: 0,
      rearLeft: 0,
      rearRight: 0,
    },
    engineStatus: '',
    rimCondition: {
      frontLeft: '',
      frontRight: '',
      rearLeft: '',
      rearRight: '',
    },
    recommendations: [],
    overallNotes: '',
  })
  const [newDamageDetected, setNewDamageDetected] = useState(false)
  const [newDamageItems, setNewDamageItems] = useState<NewDamageItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [damageComparisonAlert, setDamageComparisonAlert] = useState<string | null>(null)
  const [damageComparisonResult, setDamageComparisonResult] =
    useState<DamageComparisonResult | null>(null)
  const [isComparingDamage, setIsComparingDamage] = useState(false)

  const deliveryImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (existingData) {
      // Populate form with existing data
      setDeliveryImages(existingData.deliveryImages || [])
      setVehicleInspection(existingData.vehicleInspection || vehicleInspection)
      setNewDamageDetected(existingData.damageComparison?.newDamageDetected || false)
      setNewDamageItems(existingData.damageComparison?.newDamage || [])
      setDamageComparisonResult(existingData.damageComparison || null)
    }
  }, [existingData])

  // Auto-trigger damage comparison when delivery images are added
  useEffect(() => {
    if (deliveryImages.length > 0 && intakeData?.vehicleImages && !isComparingDamage) {
      performDamageComparison()
    }
  }, [deliveryImages, intakeData])

  const performDamageComparison = async () => {
    if (!intakeData?.vehicleImages || deliveryImages.length === 0) return

    try {
      setIsComparingDamage(true)
      setDamageComparisonAlert('Analyzing images for damage comparison...')

      const intakeImages = intakeData.vehicleImages.map((img: any) => ({
        url: img.url || img.preview,
        angle: img.angle,
        description: img.description,
      }))

      const deliveryImagesForComparison = deliveryImages.map((img) => ({
        url: img.preview,
        angle: img.angle,
        description: img.description,
      }))

      const intakeDamage = intakeData.damageAssessment?.damageItems || []

      const result = await compareDamageImages(
        intakeImages,
        deliveryImagesForComparison,
        intakeDamage,
      )

      setDamageComparisonResult(result)

      if (result.newDamageDetected) {
        setNewDamageDetected(true)
        setNewDamageItems(
          result.newDamageItems.map((item) => ({
            type: item.type,
            location: item.location,
            severity: item.severity,
            description: item.description,
            likelyDuringService: item.likelyDuringService,
          })),
        )
        setDamageComparisonAlert(
          `⚠️ AI detected ${result.newDamageItems.length} potential new damage item(s). Please review and confirm.`,
        )
      } else {
        setDamageComparisonAlert('✅ No new damage detected during AI comparison.')
      }
    } catch (error) {
      console.error('Damage comparison failed:', error)
      setDamageComparisonAlert('❌ Damage comparison failed. Please perform manual inspection.')
    } finally {
      setIsComparingDamage(false)
    }
  }

  const handleDeliveryImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    files.forEach((file) => {
      const preview = URL.createObjectURL(file)
      setDeliveryImages((prev) => [
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

  const removeDeliveryImage = (index: number) => {
    setDeliveryImages((prev) => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }

  const updateDeliveryImageAngle = (index: number, angle: string) => {
    setDeliveryImages((prev) => {
      const newImages = [...prev]
      newImages[index].angle = angle
      return newImages
    })
  }

  const updateDeliveryImageDescription = (index: number, description: string) => {
    setDeliveryImages((prev) => {
      const newImages = [...prev]
      newImages[index].description = description
      return newImages
    })
  }

  const addRecommendation = () => {
    setVehicleInspection((prev) => ({
      ...prev,
      recommendations: [
        ...prev.recommendations,
        {
          category: '',
          priority: '',
          description: '',
          estimatedCost: 0,
        },
      ],
    }))
  }

  const removeRecommendation = (index: number) => {
    setVehicleInspection((prev) => ({
      ...prev,
      recommendations: prev.recommendations.filter((_, i) => i !== index),
    }))
  }

  const updateRecommendation = (index: number, field: string, value: any) => {
    setVehicleInspection((prev) => ({
      ...prev,
      recommendations: prev.recommendations.map((rec, i) =>
        i === index ? { ...rec, [field]: value } : rec,
      ),
    }))
  }

  const addNewDamageItem = () => {
    setNewDamageItems((prev) => [
      ...prev,
      {
        type: '',
        location: '',
        severity: '',
        description: '',
        images: [],
        likelyDuringService: false,
      },
    ])
  }

  const removeNewDamageItem = (index: number) => {
    setNewDamageItems((prev) => {
      const newItems = [...prev]
      newItems.splice(index, 1)
      return newItems
    })
  }

  const updateNewDamageItem = (index: number, field: keyof NewDamageItem, value: any) => {
    setNewDamageItems((prev) => {
      const newItems = [...prev]
      newItems[index] = { ...newItems[index], [field]: value }
      return newItems
    })
  }

  const canProceedToStep2 = () => {
    return deliveryImages.length > 0 && deliveryImages.every((img) => img.angle)
  }

  const canProceedToStep3 = () => {
    return (
      vehicleInspection.batteryStatus &&
      vehicleInspection.engineStatus &&
      Object.values(vehicleInspection.tyreCondition).every((condition) => condition) &&
      Object.values(vehicleInspection.rimCondition).every((condition) => condition)
    )
  }

  const canSubmit = () => {
    const inspectionComplete = canProceedToStep3()
    const damageAssessmentComplete =
      !newDamageDetected ||
      newDamageItems.every((item) => item.type && item.location && item.severity)

    return inspectionComplete && damageAssessmentComplete
  }

  const handleSubmit = async () => {
    if (!canSubmit()) return

    setIsSubmitting(true)
    try {
      const deliveryData = {
        orderId,
        intakeId,
        deliveryImages,
        vehicleInspection,
        damageComparison: {
          newDamageDetected,
          newDamage: newDamageItems,
          aiProcessingResult: damageComparisonResult,
          comparisonNotes: damageComparisonResult?.comparisonNotes || '',
          aiProcessingStatus: damageComparisonResult?.aiProcessingStatus || 'pending',
        },
        staffMember: 'current-staff-id', // TODO: Get from auth context
      }

      console.log('Submitting delivery data:', deliveryData)

      // Generate damage report if new damage detected
      if (newDamageDetected && damageComparisonResult && intakeData) {
        const damageReport = generateDamageReport(
          intakeData,
          deliveryData as any,
          damageComparisonResult,
        )
        console.log('Damage report generated:', damageReport)

        if (damageReport.requiresCustomerNotification) {
          setDamageComparisonAlert('⚠️ New damage detected! Customer notification required.')
        }
      }

      onComplete?.(deliveryData)
    } catch (error) {
      console.error('Failed to submit delivery:', error)
      alert('Failed to submit delivery. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Step 1: Capture Delivery Images</h3>
        <p className="text-gray-400 mb-6">
          Take photos of the vehicle from multiple angles for damage comparison with intake images.
        </p>
      </div>

      {/* Delivery Images */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-purple-400" />
            Delivery Images ({deliveryImages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={() => deliveryImageInputRef.current?.click()}
              className="w-full bg-purple-500 hover:bg-purple-600"
            >
              <Upload className="w-4 h-4 mr-2" />
              Add Delivery Images
            </Button>
            <input
              ref={deliveryImageInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleDeliveryImageSelect}
              className="hidden"
            />

            {deliveryImages.length > 0 && (
              <div className="space-y-4">
                {deliveryImages.map((image, index) => (
                  <div key={index} className="border border-gray-600 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <img
                          src={image.preview}
                          alt={`Delivery ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          onClick={() => removeDeliveryImage(index)}
                          variant="destructive"
                          size="sm"
                          className="mt-2 w-full"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-white">Image Angle *</Label>
                          <Select
                            value={image.angle}
                            onValueChange={(value) => updateDeliveryImageAngle(index, value)}
                          >
                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                              <SelectValue placeholder="Select angle" />
                            </SelectTrigger>
                            <SelectContent>
                              {DELIVERY_ANGLES.map((angle) => (
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
                          onChange={(e) => updateDeliveryImageDescription(index, e.target.value)}
                          placeholder="Optional description"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>
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
          Next: Vehicle Inspection
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Step 2: Vehicle Inspection</h3>
        <p className="text-gray-400 mb-6">
          Complete detailed inspection of battery, tyres, engine, and rims.
        </p>
      </div>

      {/* Battery Status */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Battery className="w-5 h-5 text-green-400" />
            Battery Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={vehicleInspection.batteryStatus}
            onValueChange={(value) =>
              setVehicleInspection((prev) => ({ ...prev, batteryStatus: value }))
            }
          >
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Select battery status" />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_OPTIONS.filter((opt) =>
                ['excellent', 'good', 'fair', 'poor', 'needs_replacement'].includes(opt.value),
              ).map((condition) => (
                <SelectItem key={condition.value} value={condition.value}>
                  {condition.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Engine Status */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            Engine Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={vehicleInspection.engineStatus}
            onValueChange={(value) =>
              setVehicleInspection((prev) => ({ ...prev, engineStatus: value }))
            }
          >
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Select engine status" />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_OPTIONS.filter((opt) =>
                ['excellent', 'good', 'fair', 'poor', 'needs_service', 'not_checked'].includes(
                  opt.value,
                ),
              ).map((condition) => (
                <SelectItem key={condition.value} value={condition.value}>
                  {condition.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tyre Condition */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Gauge className="w-5 h-5 text-orange-400" />
            Tyre Condition & Pressure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Tyre Conditions */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Tyre Condition</h4>
              {Object.entries(vehicleInspection.tyreCondition).map(([position, condition]) => (
                <div key={position}>
                  <Label className="text-white capitalize">
                    {position.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                  <Select
                    value={condition}
                    onValueChange={(value) =>
                      setVehicleInspection((prev) => ({
                        ...prev,
                        tyreCondition: { ...prev.tyreCondition, [position]: value },
                      }))
                    }
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPTIONS.filter((opt) =>
                        ['excellent', 'good', 'fair', 'poor', 'needs_replacement'].includes(
                          opt.value,
                        ),
                      ).map((cond) => (
                        <SelectItem key={cond.value} value={cond.value}>
                          {cond.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Tyre Pressures */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Tyre Pressure (PSI)</h4>
              {Object.entries(vehicleInspection.tyrePressure).map(([position, pressure]) => (
                <div key={position}>
                  <Label className="text-white capitalize">
                    {position.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={pressure || ''}
                    onChange={(e) =>
                      setVehicleInspection((prev) => ({
                        ...prev,
                        tyrePressure: { ...prev.tyrePressure, [position]: Number(e.target.value) },
                      }))
                    }
                    placeholder="PSI"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              ))}
            </div>
          </div>
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
        <h3 className="text-xl font-semibold text-white mb-4">
          Step 3: Damage Assessment & Recommendations
        </h3>
        <p className="text-gray-400 mb-6">
          Compare with intake images and document any new damage found.
        </p>
      </div>

      {/* Damage Comparison Alert */}
      {damageComparisonAlert && (
        <Card
          className={cn(
            'border',
            damageComparisonAlert.includes('✅')
              ? 'bg-green-500/10 border-green-500/30'
              : damageComparisonAlert.includes('⚠️')
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-red-500/10 border-red-500/30',
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle
                  className={cn(
                    'w-5 h-5',
                    damageComparisonAlert.includes('✅')
                      ? 'text-green-400'
                      : damageComparisonAlert.includes('⚠️')
                        ? 'text-yellow-400'
                        : 'text-red-400',
                  )}
                />
                <p
                  className={cn(
                    damageComparisonAlert.includes('✅')
                      ? 'text-green-400'
                      : damageComparisonAlert.includes('⚠️')
                        ? 'text-yellow-400'
                        : 'text-red-400',
                  )}
                >
                  {damageComparisonAlert}
                </p>
              </div>
              {deliveryImages.length > 0 && intakeData?.vehicleImages && (
                <Button
                  onClick={performDamageComparison}
                  disabled={isComparingDamage}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {isComparingDamage ? (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Re-analyze
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Damage Detection */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            New Damage Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="newDamage"
                checked={newDamageDetected}
                onCheckedChange={(checked) => setNewDamageDetected(checked as boolean)}
              />
              <Label htmlFor="newDamage" className="text-white">
                New damage detected during delivery inspection
              </Label>
            </div>

            {newDamageDetected && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white">New Damage Items</h4>
                  <Button onClick={addNewDamageItem} className="bg-red-500 hover:bg-red-600">
                    Add Damage Item
                  </Button>
                </div>

                {newDamageItems.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">
                    Click "Add Damage Item" to document new damage
                  </p>
                ) : (
                  <div className="space-y-4">
                    {newDamageItems.map((item, index) => (
                      <div key={index} className="border border-red-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-semibold text-white">New Damage {index + 1}</h5>
                          <Button
                            onClick={() => removeNewDamageItem(index)}
                            variant="destructive"
                            size="sm"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">Damage Type *</Label>
                            <Select
                              value={item.type}
                              onValueChange={(value) => updateNewDamageItem(index, 'type', value)}
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
                              onChange={(e) =>
                                updateNewDamageItem(index, 'location', e.target.value)
                              }
                              placeholder="e.g., Front bumper, Left door"
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Severity *</Label>
                            <Select
                              value={item.severity}
                              onValueChange={(value) =>
                                updateNewDamageItem(index, 'severity', value)
                              }
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
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`likelyDuringService-${index}`}
                              checked={item.likelyDuringService}
                              onCheckedChange={(checked) =>
                                updateNewDamageItem(
                                  index,
                                  'likelyDuringService',
                                  checked as boolean,
                                )
                              }
                            />
                            <Label
                              htmlFor={`likelyDuringService-${index}`}
                              className="text-white text-sm"
                            >
                              Likely occurred during service
                            </Label>
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-white">Description</Label>
                            <Textarea
                              value={item.description}
                              onChange={(e) =>
                                updateNewDamageItem(index, 'description', e.target.value)
                              }
                              placeholder="Detailed description of the new damage"
                              className="bg-gray-700 border-gray-600 text-white"
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Recommendations</CardTitle>
            <Button onClick={addRecommendation} className="bg-blue-500 hover:bg-blue-600">
              Add Recommendation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {vehicleInspection.recommendations.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No recommendations added</p>
          ) : (
            <div className="space-y-4">
              {vehicleInspection.recommendations.map((rec, index) => (
                <div key={index} className="border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-semibold text-white">Recommendation {index + 1}</h5>
                    <Button
                      onClick={() => removeRecommendation(index)}
                      variant="destructive"
                      size="sm"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Category</Label>
                      <Select
                        value={rec.category}
                        onValueChange={(value) => updateRecommendation(index, 'category', value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {RECOMMENDATION_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white">Priority</Label>
                      <Select
                        value={rec.priority}
                        onValueChange={(value) => updateRecommendation(index, 'priority', value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITY_LEVELS.map((priority) => (
                            <SelectItem key={priority.value} value={priority.value}>
                              {priority.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white">Estimated Cost</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={rec.estimatedCost || ''}
                        onChange={(e) =>
                          updateRecommendation(index, 'estimatedCost', Number(e.target.value))
                        }
                        placeholder="0.00"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Description</Label>
                      <Textarea
                        value={rec.description}
                        onChange={(e) => updateRecommendation(index, 'description', e.target.value)}
                        placeholder="Recommendation details"
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

      {/* Overall Notes */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Overall Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={vehicleInspection.overallNotes}
            onChange={(e) =>
              setVehicleInspection((prev) => ({ ...prev, overallNotes: e.target.value }))
            }
            placeholder="General notes about the vehicle condition and delivery"
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
              Complete Delivery
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
        <h1 className="text-3xl font-bold text-white mb-2">Vehicle Delivery</h1>
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
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-700 text-gray-400 border border-gray-600',
                )}
              >
                {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
              </div>
              {step < 3 && (
                <div
                  className={cn(
                    'w-16 h-1 mx-2',
                    currentStep > step ? 'bg-purple-500' : 'bg-gray-700',
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-4 space-x-16">
          <span className={cn('text-sm', currentStep >= 1 ? 'text-purple-400' : 'text-gray-400')}>
            Capture Images
          </span>
          <span className={cn('text-sm', currentStep >= 2 ? 'text-purple-400' : 'text-gray-400')}>
            Inspection
          </span>
          <span className={cn('text-sm', currentStep >= 3 ? 'text-purple-400' : 'text-gray-400')}>
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
