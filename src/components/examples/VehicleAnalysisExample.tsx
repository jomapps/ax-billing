'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Camera, Wrench, DollarSign } from 'lucide-react'

interface VehicleAnalysisResult {
  success: boolean
  analysis?: {
    vehicle_type: string
    make?: string
    model?: string
    year?: number
    color?: string
    damages: Array<{
      type: string
      severity: string
      location: string
      description: string
      estimated_cost_range?: string
    }>
    overall_condition: string
    estimated_total_cost?: string
    recommendations: string[]
  }
  serviceRecommendations?: string[]
  costEstimate?: string
  error?: string
}

export default function VehicleAnalysisExample() {
  const [imageUrl, setImageUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<VehicleAnalysisResult | null>(null)

  const analyzeVehicle = async () => {
    if (!imageUrl.trim()) {
      alert('Please enter an image URL')
      return
    }

    setIsAnalyzing(true)
    setResult(null)

    try {
      const response = await fetch('/api/v1/ai/analyze-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: imageUrl.trim(),
          customerTier: 'premium',
          generateRecommendations: true
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Analysis failed:', error)
      setResult({
        success: false,
        error: 'Failed to analyze vehicle. Please try again.'
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'minor': return 'bg-green-500/20 text-green-400'
      case 'moderate': return 'bg-yellow-500/20 text-yellow-400'
      case 'severe': return 'bg-red-500/20 text-red-400'
      case 'total_loss': return 'bg-purple-500/20 text-purple-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            BAML Vehicle Analysis Demo
          </CardTitle>
          <CardDescription className="text-gray-400">
            Test the AI-powered vehicle analysis using BAML integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter vehicle image URL..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
            />
            <Button
              onClick={analyzeVehicle}
              disabled={isAnalyzing}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Vehicle'
              )}
            </Button>
          </div>

          {imageUrl && (
            <div className="mt-4">
              <img
                src={imageUrl}
                alt="Vehicle to analyze"
                className="max-w-full h-64 object-cover rounded-lg border border-gray-600"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {result.success && result.analysis ? (
            <>
              {/* Vehicle Information */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-green-400">Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-gray-400">Type:</span>
                      <p className="text-white font-medium">{result.analysis.vehicle_type}</p>
                    </div>
                    {result.analysis.make && (
                      <div>
                        <span className="text-gray-400">Make:</span>
                        <p className="text-white font-medium">{result.analysis.make}</p>
                      </div>
                    )}
                    {result.analysis.model && (
                      <div>
                        <span className="text-gray-400">Model:</span>
                        <p className="text-white font-medium">{result.analysis.model}</p>
                      </div>
                    )}
                    {result.analysis.year && (
                      <div>
                        <span className="text-gray-400">Year:</span>
                        <p className="text-white font-medium">{result.analysis.year}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-400">Overall Condition:</span>
                    <p className="text-white">{result.analysis.overall_condition}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Damages */}
              {result.analysis.damages && result.analysis.damages.length > 0 && (
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-orange-400">Detected Damages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.analysis.damages.map((damage, index) => (
                        <div key={index} className="border border-gray-600 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSeverityColor(damage.severity)}>
                              {damage.severity}
                            </Badge>
                            <span className="text-white font-medium">{damage.type}</span>
                          </div>
                          <p className="text-gray-400 text-sm mb-1">
                            <strong>Location:</strong> {damage.location}
                          </p>
                          <p className="text-gray-300 text-sm">{damage.description}</p>
                          {damage.estimated_cost_range && (
                            <p className="text-cyan-400 text-sm mt-1">
                              <strong>Estimated Cost:</strong> {damage.estimated_cost_range}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Service Recommendations */}
              {result.serviceRecommendations && result.serviceRecommendations.length > 0 && (
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-blue-400 flex items-center gap-2">
                      <Wrench className="w-5 h-5" />
                      Service Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.serviceRecommendations.map((recommendation, index) => (
                        <li key={index} className="text-gray-300 flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Cost Estimate */}
              {result.costEstimate && (
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-green-400 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Cost Estimate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-gray-300 whitespace-pre-wrap text-sm">
                      {result.costEstimate}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="bg-gray-900 border-red-500">
              <CardHeader>
                <CardTitle className="text-red-400">Analysis Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">{result.error || 'Unknown error occurred'}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
