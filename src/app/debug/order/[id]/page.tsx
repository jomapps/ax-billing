import { Suspense } from 'react'

async function OrderDebugContent({ orderId }: { orderId: string }) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/orders/${orderId}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch order data`)
    }

    const data = await response.json()

    return (
      <div className="p-8 bg-gray-900 text-white min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Order Debug: {orderId}</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">API Response Success:</h2>
            <p className={data.success ? 'text-green-400' : 'text-red-400'}>
              {data.success ? 'TRUE' : 'FALSE'}
            </p>
          </div>

          {data.order && (
            <>
              <div>
                <h2 className="text-lg font-semibold">Order ID:</h2>
                <p>{data.order.orderID}</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold">Vehicle ID:</h2>
                <p>{data.order.vehicle?.id || 'No vehicle'}</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold">Vehicle Images Count:</h2>
                <p className="text-yellow-400 text-xl">
                  {data.order.vehicle?.vehicleImages?.length || 0}
                </p>
              </div>

              {data.order.vehicle?.vehicleImages && data.order.vehicle.vehicleImages.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold">Vehicle Images:</h2>
                  <div className="space-y-2">
                    {data.order.vehicle.vehicleImages.map((img: any, index: number) => (
                      <div key={img.id} className="border border-gray-600 p-3 rounded">
                        <p><strong>Image {index + 1}:</strong></p>
                        <p><strong>ID:</strong> {img.id}</p>
                        <p><strong>Type:</strong> {img.imageType}</p>
                        <p><strong>URL:</strong> {img.image?.url}</p>
                        <p><strong>AI Processed:</strong> {img.aiProcessed ? 'Yes' : 'No'}</p>
                        <p><strong>Damage Detected:</strong> {img.damageDetected ? 'Yes' : 'No'}</p>
                        {img.image?.url && (
                          <img 
                            src={img.image.url} 
                            alt={img.image.alt || `${img.imageType} view`}
                            className="mt-2 max-w-xs border border-gray-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <h2 className="text-lg font-semibold">Raw JSON:</h2>
            <pre className="bg-gray-800 p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="p-8 bg-gray-900 text-white min-h-screen">
        <h1 className="text-2xl font-bold mb-4 text-red-400">Error Loading Order: {orderId}</h1>
        <p className="text-red-300">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDebugPage({ params }: PageProps) {
  const { id } = await params

  return (
    <Suspense fallback={<div className="p-8">Loading order debug info...</div>}>
      <OrderDebugContent orderId={id} />
    </Suspense>
  )
}
