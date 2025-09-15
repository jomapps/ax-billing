/**
 * Custom FAL.ai service for vehicle damage analysis
 * Handles proper authentication format that BAML doesn't support
 */

interface FalAiResponse {
  output: string
}

interface FalAiError {
  detail: string
}

export class FalAiService {
  private apiKey: string
  private baseUrl: string = 'https://fal.run'
  private model: string = 'fal-ai/moondream2/visual-query'

  constructor() {
    this.apiKey = process.env.FAL_KEY || ''
    if (!this.apiKey) {
      throw new Error('FAL_KEY environment variable is required')
    }
  }

  async analyzeVehicleImage(imageUrl: string, imageType: string): Promise<{
    success: boolean
    vehicleCondition?: string
    error?: string
    processingTime: number
  }> {
    const startTime = Date.now()

    try {
      const prompt = this.buildAnalysisPrompt(imageType)
      
      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUrl,
          prompt: prompt,
        }),
      })

      const processingTime = (Date.now() - startTime) / 1000

      if (!response.ok) {
        const errorData = await response.json() as FalAiError
        console.error('❌ FAL.ai API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        })
        
        return {
          success: false,
          error: `FAL.ai API error: ${response.status} - ${errorData.detail || response.statusText}`,
          processingTime,
        }
      }

      const data = await response.json() as FalAiResponse
      
      // Parse the response to extract vehicle condition
      const vehicleCondition = this.parseVehicleCondition(data.output)
      
      console.log('✅ FAL.ai analysis successful:', {
        imageType,
        vehicleCondition,
        processingTime,
        responseLength: data.output.length,
      })

      return {
        success: true,
        vehicleCondition,
        processingTime,
      }

    } catch (error) {
      const processingTime = (Date.now() - startTime) / 1000
      console.error('❌ FAL.ai service error:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
      }
    }
  }

  private buildAnalysisPrompt(imageType: string): string {
    const basePrompt = `Analyze this vehicle image for damage assessment and vehicle information.

Image Type: ${imageType}

This is a ${imageType} view of the vehicle. Pay special attention to:
- Vehicle condition and any visible damage
- Overall vehicle state (excellent, good, fair, poor)
- Any scratches, dents, or other damage

Please provide a brief assessment including:
1. Overall vehicle condition (excellent/good/fair/poor)
2. Any visible damages with brief description
3. General vehicle information if visible

Be concise and focus on the most important observations.`

    return basePrompt
  }

  private parseVehicleCondition(output: string): string {
    const lowerOutput = output.toLowerCase()
    
    // Look for condition keywords in order of preference
    if (lowerOutput.includes('excellent')) return 'excellent'
    if (lowerOutput.includes('good')) return 'good'
    if (lowerOutput.includes('fair')) return 'fair'
    if (lowerOutput.includes('poor')) return 'poor'
    
    // Look for damage indicators
    if (lowerOutput.includes('damage') || lowerOutput.includes('scratch') || lowerOutput.includes('dent')) {
      return 'fair'
    }
    
    // Default to good if no specific condition mentioned
    return 'good'
  }

  async testConnection(): Promise<boolean> {
    try {
      const testImageUrl = 'https://llava-vl.github.io/static/images/monalisa.jpg'
      const result = await this.analyzeVehicleImage(testImageUrl, 'test')
      return result.success
    } catch (error) {
      console.error('❌ FAL.ai connection test failed:', error)
      return false
    }
  }
}

export const falAiService = new FalAiService()
