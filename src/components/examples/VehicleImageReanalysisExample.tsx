'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VehicleImageThumbnails } from '@/components/vehicles/VehicleImageThumbnails'
import { Loader2, TestTube } from 'lucide-react'

// Mock data for testing
const mockVehicleImages = [
  {
    id: '1',
    imageType: 'front',
    image: {
      url: 'https://media.ft.tc/media/vehicle-AX-20250908-5336-1757438371929.jpg',
      alt: 'Front view',
    },
    aiAnalysis: {
      success: true,
      vehicleCondition: 'good',
      processingTime: 2.3,
    },
    damageDetected: false,
  },
  {
    id: '2',
    imageType: 'back',
    image: {
      url: 'https://media.ft.tc/media/vehicle-AX-20250908-5336-1757438371929.jpg',
      alt: 'Back view',
    },
    aiAnalysis: {
      success: false,
      error: 'AI analysis failed - unable to detect vehicle',
    },
    damageDetected: false,
  },
  {
    id: '3',
    imageType: 'left',
    image: {
      url: 'https://media.ft.tc/media/vehicle-AX-20250908-5336-1757438371929.jpg',
      alt: 'Left view',
    },
    aiAnalysis: {
      success: true,
      vehicleCondition: 'fair',
      processingTime: 1.8,
    },
    damageDetected: true,
    damageDescription: 'Minor scratches on left door',
  },
  {
    id: '4',
    imageType: 'right',
    image: {
      url: 'https://media.ft.tc/media/vehicle-AX-20250908-5336-1757438371929.jpg',
      alt: 'Right view',
    },
    // No aiAnalysis - pending
    damageDetected: false,
  },
]

export function VehicleImageReanalysisExample() {
  const [vehicleId, setVehicleId] = useState('test-vehicle-123')
  const [images, setImages] = useState(mockVehicleImages)
  const [isTestingReanalysis, setIsTestingReanalysis] = useState(false)

  const handleReanalysisComplete = () => {
    console.log('Reanalysis completed - refreshing data...')
    // In a real app, this would refetch the vehicle data
    // For demo purposes, we'll simulate successful reanalysis
    setImages(prevImages =>
      prevImages.map(img => {
        if (!img.aiAnalysis?.success) {
          return {
            ...img,
            aiAnalysis: {
              success: true,
              vehicleCondition: 'good',
              processingTime: Math.random() * 3 + 1,
            },
          }
        }
        return img
      })
    )
  }

  const testReanalysisAPI = async () => {
    setIsTestingReanalysis(true)
    try {
      const response = await fetch('/api/v1/ai/reanalyze-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: vehicleId,
        }),
      })

      const result = await response.json()
      console.log('Reanalysis API test result:', result)
      
      if (result.success) {
        alert(`Reanalysis API test successful!\n\nReanalyzed: ${result.reanalyzedImages} images\nSuccess: ${result.successCount}\nFailures: ${result.failureCount}`)
      } else {
        alert(`Reanalysis API test failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Reanalysis API test failed:', error)
      alert(`API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsTestingReanalysis(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TestTube className="w-5 h-5 text-blue-400" />
            Vehicle Image Reanalysis Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicleId" className="text-gray-300">
                Vehicle ID
              </Label>
              <Input
                id="vehicleId"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Enter vehicle ID"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={testReanalysisAPI}
                disabled={isTestingReanalysis || !vehicleId}
                className="w-full"
              >
                {isTestingReanalysis ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing API...
                  </>
                ) : (
                  'Test Reanalysis API'
                )}
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            <p><strong>Demo Features:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>View image thumbnails with analysis status badges</li>
              <li>Click failed images to see reanalysis button</li>
              <li>Use "Reanalyze Failed" button to retry all failed analyses</li>
              <li>Click images to view in full-screen modal</li>
              <li>Test the reanalysis API endpoint</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <VehicleImageThumbnails
        vehicleId={vehicleId}
        images={images}
        onReanalysisComplete={handleReanalysisComplete}
      />

      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Analysis Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">
                {images.filter(img => img.aiAnalysis?.success).length}
              </div>
              <div className="text-sm text-gray-400">Successful</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">
                {images.filter(img => img.aiAnalysis && !img.aiAnalysis.success).length}
              </div>
              <div className="text-sm text-gray-400">Failed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {images.filter(img => !img.aiAnalysis).length}
              </div>
              <div className="text-sm text-gray-400">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
