'use client'

import { VehicleImageThumbnails } from '@/components/vehicles/VehicleImageThumbnails'

// Mock data for testing thumbnails
const mockVehicleImages = [
  {
    id: '1',
    imageType: 'front',
    image: {
      id: 'media1',
      url: '/api/placeholder/400/300/0066cc/ffffff?text=Front+View',
      alt: 'Front view of vehicle',
      filename: 'front.jpg',
    },
    aiProcessed: true,
    damageDetected: false,
    aiAnalysis: {
      vehicleCondition: 'excellent',
      processingTime: 2.5,
    },
  },
  {
    id: '2',
    imageType: 'back',
    image: {
      id: 'media2',
      url: '/api/placeholder/400/300/cc6600/ffffff?text=Back+View',
      alt: 'Back view of vehicle',
      filename: 'back.jpg',
    },
    aiProcessed: true,
    damageDetected: true,
    damageDescription: 'Minor scratch on rear bumper',
    aiAnalysis: {
      vehicleCondition: 'good',
      processingTime: 3.1,
    },
  },
  {
    id: '3',
    imageType: 'left',
    image: {
      id: 'media3',
      url: '/api/placeholder/400/300/009900/ffffff?text=Left+Side',
      alt: 'Left side of vehicle',
      filename: 'left.jpg',
    },
    aiProcessed: false,
    damageDetected: false,
    aiAnalysis: null,
  },
  {
    id: '4',
    imageType: 'right',
    image: {
      id: 'media4',
      url: '/api/placeholder/400/300/cc0066/ffffff?text=Right+Side',
      alt: 'Right side of vehicle',
      filename: 'right.jpg',
    },
    aiProcessed: true,
    damageDetected: false,
    aiAnalysis: {
      vehicleCondition: 'excellent',
      processingTime: 1.8,
    },
  },
]

export default function ThumbnailsTestPage() {
  const handleReanalysisComplete = () => {
    console.log('Reanalysis completed - would refresh data in real app')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Vehicle Image Thumbnails Test</h1>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Vehicle Capture Section</h2>

          <div className="border-t border-gray-200 pt-4">
            <VehicleImageThumbnails
              vehicleId="test-vehicle-123"
              images={mockVehicleImages}
              onReanalysisComplete={handleReanalysisComplete}
            />
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Test Features</h3>
          <ul className="text-blue-800 space-y-1">
            <li>✅ Image thumbnails with different analysis states</li>
            <li>✅ Color-coded status badges (Green: success, Red: failed, Yellow: pending)</li>
            <li>✅ Damage indicators on images with detected damage</li>
            <li>✅ Hover effects for reanalysis buttons</li>
            <li>✅ Full-screen modal when clicking images</li>
            <li>✅ Bulk reanalysis functionality</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
