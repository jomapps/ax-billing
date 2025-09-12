import VehicleAnalysisExample from '@/components/examples/VehicleAnalysisExample'

export default function BAMLDemoPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400 mb-4">
            BAML AI Integration Demo
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Experience the power of BAML (Boundary ML) for vehicle analysis. 
            Upload a vehicle image URL to see AI-powered damage detection, 
            service recommendations, and cost estimation in action.
          </p>
        </div>
        
        <VehicleAnalysisExample />
        
        <div className="mt-12 text-center">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-cyan-400 mb-4">
              Sample Image URLs for Testing
            </h2>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <strong>Car with visible damage:</strong><br />
                <code className="bg-gray-800 px-2 py-1 rounded text-xs">
                  https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800
                </code>
              </p>
              <p>
                <strong>Clean car:</strong><br />
                <code className="bg-gray-800 px-2 py-1 rounded text-xs">
                  https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800
                </code>
              </p>
              <p>
                <strong>Truck:</strong><br />
                <code className="bg-gray-800 px-2 py-1 rounded text-xs">
                  https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
