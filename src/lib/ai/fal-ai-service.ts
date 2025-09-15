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
  private model: string

  constructor() {
    this.apiKey = process.env.FAL_KEY || ''
    this.model = process.env.FAL_VISION_MODEL || 'fal-ai/moondream2/visual-query'

    if (!this.apiKey) {
      throw new Error('FAL_KEY environment variable is required')
    }
    if (!this.model) {
      throw new Error('FAL_VISION_MODEL environment variable is required')
    }
  }

  async analyzeVehicleImage(
    imageUrl: string,
    imageType: string,
  ): Promise<{
    success: boolean
    vehicleCondition?: string
    error?: string
    processingTime: number
  }> {
    const startTime = Date.now()

    try {
      // Use the FAL.ai endpoint from environment variable
      const endpoint = `${this.baseUrl}/${this.model}`
      const requestPayload = {
        image_url: imageUrl,
        prompt: this.buildVehicleAnalysisPrompt(imageType),
      }
      const requestHeaders = {
        Authorization: `Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      }

      console.log('🚀 FAL.ai API Request:', {
        endpoint,
        method: 'POST',
        headers: {
          ...requestHeaders,
          Authorization: `Key ${this.apiKey.substring(0, 10)}...${this.apiKey.substring(this.apiKey.length - 4)}`, // Masked for security
        },
        payload: requestPayload,
      })

      const falResponse = await fetch(endpoint, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestPayload),
      })

      console.log('📡 FAL.ai API Response Status:', {
        status: falResponse.status,
        statusText: falResponse.statusText,
        ok: falResponse.ok,
        headers: Object.fromEntries(falResponse.headers.entries()),
      })

      if (!falResponse.ok) {
        const errorText = await falResponse.text()
        let errorData: any
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }

        console.error('❌ FAL.ai API error:', {
          status: falResponse.status,
          statusText: falResponse.statusText,
          errorText,
          errorData,
        })

        return {
          success: false,
          error: `FAL.ai API error: ${falResponse.status} - ${JSON.stringify(errorData)}`,
          processingTime: (Date.now() - startTime) / 1000,
        }
      }

      const responseText = await falResponse.text()
      console.log('📥 FAL.ai Raw Response:', responseText)

      let falData: FalAiResponse
      try {
        falData = JSON.parse(responseText) as FalAiResponse
      } catch (parseError) {
        console.error('❌ Failed to parse FAL.ai response as JSON:', parseError)
        return {
          success: false,
          error: `Invalid JSON response from FAL.ai: ${responseText}`,
          processingTime: (Date.now() - startTime) / 1000,
        }
      }

      console.log('✅ FAL.ai Parsed Response:', falData)

      const vehicleAnalysis = falData.output

      console.log('✅ FAL.ai vehicle analysis received:', {
        imageType,
        analysisLength: vehicleAnalysis.length,
        analysis: vehicleAnalysis.substring(0, 200) + '...',
      })

      const processingTime = (Date.now() - startTime) / 1000

      // Parse the FAL.ai response to extract vehicle condition
      const vehicleCondition = this.parseVehicleCondition(vehicleAnalysis)

      console.log('✅ FAL.ai analysis successful:', {
        imageType,
        vehicleCondition,
        processingTime,
        analysisLength: vehicleAnalysis.length,
      })

      return {
        success: true,
        vehicleCondition,
        processingTime,
      }
    } catch (error) {
      const processingTime = (Date.now() - startTime) / 1000
      console.error('❌ FAL.ai analysis error:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
      }
    }
  }

  private buildVehicleAnalysisPrompt(imageType: string): string {
    return `Analyze this vehicle image and identify: vehicle type, make, model, year, color, any visible damages, and overall condition. Image type: ${imageType} view of the vehicle.`
  }

  private buildAnalysisPrompt(imageType: string, imageDescription: string): string {
    const analysisPrompt = `Based on this image description from a vision AI model, analyze the vehicle for damage assessment and condition.

Image Type: ${imageType} view of the vehicle
Image Description: ${imageDescription}

Please analyze this description and provide:

1. Overall vehicle condition (excellent/good/fair/poor/damaged)
2. Any visible damages mentioned in the description
3. Vehicle type, color, or other details if mentioned
4. Assessment of the vehicle's state based on the description

Focus on extracting vehicle condition and damage information from the description. If the description mentions any scratches, dents, damage, or poor condition, classify accordingly.

Respond with a brief analysis focusing on vehicle condition.`

    return analysisPrompt
  }

  private parseVehicleCondition(output: string): string {
    const lowerOutput = output.toLowerCase()

    // Look for condition keywords in order of preference
    if (lowerOutput.includes('excellent')) return 'excellent'
    if (lowerOutput.includes('good')) return 'good'
    if (lowerOutput.includes('fair')) return 'fair'
    if (lowerOutput.includes('poor')) return 'poor'

    // Look for damage indicators
    if (
      lowerOutput.includes('damage') ||
      lowerOutput.includes('scratch') ||
      lowerOutput.includes('dent')
    ) {
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
