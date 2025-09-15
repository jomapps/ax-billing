import { VehicleImageReanalysisExample } from '@/components/examples/VehicleImageReanalysisExample'

export default function VehicleReanalysisTestPage() {
  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Vehicle Image Reanalysis Test
          </h1>
          <p className="text-gray-400">
            Test the vehicle image thumbnail display and reanalysis functionality
          </p>
        </div>
        
        <VehicleImageReanalysisExample />
      </div>
    </div>
  )
}
