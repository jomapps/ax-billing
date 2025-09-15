'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, RefreshCw, Loader2, Camera } from 'lucide-react'
import Image from 'next/image'

interface VehicleImage {
  id: string
  imageType: string
  image: {
    url: string
    alt?: string
  }
  aiProcessed?: boolean
  aiAnalysis?: {
    success?: boolean
    vehicleCondition?: string
    error?: string
    processingTime?: number
  }
  damageDetected?: boolean
  damageDescription?: string
}

interface VehicleImageThumbnailsProps {
  vehicleId: string
  images: VehicleImage[]
  onReanalysisComplete?: () => void
  className?: string
}

const getImageTypeIcon = (imageType: string) => {
  switch (imageType) {
    case 'front':
      return '🚗'
    case 'back':
      return '🔙'
    case 'left':
      return '⬅️'
    case 'right':
      return '➡️'
    case 'interior':
      return '🪑'
    case 'damage':
      return '💥'
    default:
      return '📷'
  }
}

const formatImageType = (imageType: string) => {
  return imageType.charAt(0).toUpperCase() + imageType.slice(1)
}

const getAnalysisStatus = (image: VehicleImage) => {
  // Check if AI processing was attempted
  if (image.aiProcessed === false || !image.aiAnalysis) {
    return { status: 'pending', color: 'bg-yellow-500/20 text-yellow-400', text: 'Pending' }
  }

  // If aiProcessed is true or aiAnalysis.success is true, consider it successful
  if (image.aiProcessed === true || image.aiAnalysis?.success === true) {
    return { status: 'success', color: 'bg-green-500/20 text-green-400', text: 'Analyzed' }
  }

  // If there's an error in aiAnalysis, it failed
  if (image.aiAnalysis?.error) {
    return { status: 'failed', color: 'bg-red-500/20 text-red-400', text: 'Failed' }
  }

  // Default to pending if unclear
  return { status: 'pending', color: 'bg-yellow-500/20 text-yellow-400', text: 'Pending' }
}

export function VehicleImageThumbnails({
  vehicleId,
  images,
  onReanalysisComplete,
  className = '',
}: VehicleImageThumbnailsProps) {
  const [reanalyzingImages, setReanalyzingImages] = useState<Set<string>>(new Set())
  const [reanalyzingAll, setReanalyzingAll] = useState(false)

  const failedImages = images.filter((img) => {
    const status = getAnalysisStatus(img)
    return status.status === 'failed'
  })
  const hasFailedAnalysis = failedImages.length > 0

  const reanalyzeImage = async (imageId: string) => {
    setReanalyzingImages((prev) => new Set(prev).add(imageId))

    try {
      const response = await fetch('/api/v1/ai/reanalyze-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId,
          imageIds: [imageId],
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Image reanalysis successful:', result)
        onReanalysisComplete?.()
      } else {
        console.error('❌ Image reanalysis failed:', result.error)
        alert(`Reanalysis failed: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Reanalysis request failed:', error)
      alert('Failed to reanalyze image. Please try again.')
    } finally {
      setReanalyzingImages((prev) => {
        const newSet = new Set(prev)
        newSet.delete(imageId)
        return newSet
      })
    }
  }

  const reanalyzeAllFailed = async () => {
    setReanalyzingAll(true)

    try {
      const response = await fetch('/api/v1/ai/reanalyze-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId,
          // Don't specify imageIds to reanalyze all failed images
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Bulk reanalysis successful:', result)
        onReanalysisComplete?.()
      } else {
        console.error('❌ Bulk reanalysis failed:', result.error)
        alert(`Reanalysis failed: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Bulk reanalysis request failed:', error)
      alert('Failed to reanalyze images. Please try again.')
    } finally {
      setReanalyzingAll(false)
    }
  }

  const reanalyzeAllImages = async () => {
    if (!vehicleId || images.length === 0) return

    setReanalyzingAll(true)
    try {
      const response = await fetch('/api/v1/ai/reanalyze-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId,
          imageIds: images.map((img) => img.id), // Reanalyze ALL images
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ All images reanalyzed successfully')
        onReanalysisComplete?.()
      } else {
        console.error('❌ Bulk reanalysis failed:', result.error)
        alert(`Reanalysis failed: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Bulk reanalysis request failed:', error)
      alert('Failed to reanalyze images. Please try again.')
    } finally {
      setReanalyzingAll(false)
    }
  }

  if (!images || images.length === 0) {
    return (
      <Card className={`bg-gray-800/50 border-gray-700 ${className}`}>
        <CardContent className="p-6 text-center text-gray-500">
          <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No images captured yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={`bg-gray-800/50 border-gray-700 ${className}`}>
        <CardContent className="p-4">
          {/* Header with reanalyze buttons */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Vehicle Images ({images.length})</h3>
            <div className="flex gap-2">
              {/* Reanalyze Failed button (only if there are failures) */}
              {hasFailedAnalysis && (
                <Button
                  onClick={reanalyzeAllFailed}
                  disabled={reanalyzingAll}
                  size="sm"
                  variant="outline"
                  className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                >
                  {reanalyzingAll ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Reanalyzing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reanalyze Failed ({failedImages.length})
                    </>
                  )}
                </Button>
              )}

              {/* Reanalyze All button (always visible) */}
              <Button
                onClick={reanalyzeAllImages}
                disabled={reanalyzingAll}
                size="sm"
                variant="outline"
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                {reanalyzingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reanalyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reanalyze All
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Image grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((image) => {
              const analysisStatus = getAnalysisStatus(image)
              const isReanalyzing = reanalyzingImages.has(image.id)

              return (
                <div key={image.id} className="relative group">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden p-0 border-0">
                    <div className="relative aspect-square">
                      <div
                        className="w-full h-full cursor-pointer rounded-lg overflow-hidden"
                        onClick={() => window.open(image.image.url, '_blank')}
                      >
                        <Image
                          src={image.image.url}
                          alt={image.image.alt || `${formatImageType(image.imageType)} view`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Image type badge */}
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs">
                          {getImageTypeIcon(image.imageType)} {formatImageType(image.imageType)}
                        </Badge>
                      </div>

                      {/* Analysis status badge */}
                      <div className="absolute top-2 right-2">
                        <Badge className={`text-xs ${analysisStatus.color}`}>
                          {analysisStatus.status === 'success' && (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          )}
                          {analysisStatus.status === 'failed' && (
                            <AlertTriangle className="w-3 h-3 mr-1" />
                          )}
                          {analysisStatus.status === 'pending' && (
                            <Loader2 className="w-3 h-3 mr-1" />
                          )}
                          {analysisStatus.text}
                        </Badge>
                      </div>

                      {/* Damage indicator */}
                      {image.damageDetected && (
                        <div className="absolute bottom-2 right-2">
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Damage
                          </Badge>
                        </div>
                      )}

                      {/* Reanalyze button for ALL images (bottom-left corner) */}
                      <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            reanalyzeImage(image.id)
                          }}
                          disabled={isReanalyzing}
                          size="sm"
                          className={`text-xs px-2 py-1 ${
                            analysisStatus.status === 'failed'
                              ? 'bg-orange-600 hover:bg-orange-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                          title={`Reanalyze ${formatImageType(image.imageType)} image`}
                        >
                          {isReanalyzing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Reanalyze
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
