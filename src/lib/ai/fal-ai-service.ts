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

      // Parse the FAL.ai response to extract detailed information
      const analysisDetails = this.parseDetailedAnalysis(vehicleAnalysis)

      console.log('✅ FAL.ai analysis successful:', {
        imageType,
        vehicleCondition: analysisDetails.condition,
        licensePlate: analysisDetails.licensePlate,
        vehicleType: analysisDetails.vehicleType,
        processingTime,
        analysisLength: vehicleAnalysis.length,
      })

      return {
        success: true,
        vehicleCondition: analysisDetails.condition,
        processingTime,
        rawAnalysis: vehicleAnalysis,
        licensePlate: analysisDetails.licensePlate,
        vehicleType: analysisDetails.vehicleType,
        make: analysisDetails.make,
        model: analysisDetails.model,
        color: analysisDetails.color,
        damages: analysisDetails.damages,
        details: analysisDetails,
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
    return `Analyze this vehicle image in detail. This is a ${imageType} view of the vehicle.

Please provide a comprehensive analysis including:

VEHICLE IDENTIFICATION:
- Vehicle type (car, truck, SUV, van, motorcycle, etc.)
- Make and model if visible
- Approximate year or generation
- Color (be specific: dark blue, metallic silver, etc.)
- License plate number if visible (read all characters carefully)

CONDITION ASSESSMENT:
- Overall condition (excellent/good/fair/poor/damaged)
- Any visible damages, scratches, dents, or wear
- Paint condition
- Body panel alignment
- Tire condition if visible
- Window condition

SPECIFIC DETAILS:
- Any distinctive features, modifications, or accessories
- Cleanliness and maintenance level
- Any missing parts or components
- Rust, corrosion, or weathering

Be thorough and specific in your observations. If you cannot clearly see something, state "not clearly visible" rather than guessing.`
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

  private parseDetailedAnalysis(output: string): {
    condition: string
    licensePlate: string | null
    vehicleType: string | null
    make: string | null
    model: string | null
    color: string | null
    damages: string[]
    year: string | null
    features: string[]
  } {
    const lowerOutput = output.toLowerCase()

    // Extract license plate
    const licensePlate = this.extractLicensePlate(output)

    // Extract vehicle type
    const vehicleType = this.extractVehicleType(output)

    // Extract make and model
    const { make, model } = this.extractMakeModel(output)

    // Extract color
    const color = this.extractColor(output)

    // Extract year
    const year = this.extractYear(output)

    // Extract damages
    const damages = this.extractDamages(output)

    // Extract features
    const features = this.extractFeatures(output)

    // Determine condition
    let condition = 'good'
    if (lowerOutput.includes('excellent')) {
      condition = 'excellent'
    } else if (
      lowerOutput.includes('poor') ||
      lowerOutput.includes('damaged') ||
      lowerOutput.includes('bad')
    ) {
      condition = 'poor'
    } else if (
      lowerOutput.includes('fair') ||
      lowerOutput.includes('moderate') ||
      damages.length > 0
    ) {
      condition = 'fair'
    } else if (lowerOutput.includes('good')) {
      condition = 'good'
    }

    return {
      condition,
      licensePlate,
      vehicleType,
      make,
      model,
      color,
      damages,
      year,
      features,
    }
  }

  private extractLicensePlate(output: string): string | null {
    // Look for license plate patterns
    const patterns = [
      /license plate reads ([A-Z0-9\s-]+)/i,
      /license plate[:\s]+([A-Z0-9\s-]+)/i,
      /plate reads ([A-Z0-9\s-]+)/i,
      /plate[:\s]+([A-Z0-9\s-]+)/i,
      /registration[:\s]+([A-Z0-9\s-]+)/i,
      /number plate[:\s]+([A-Z0-9\s-]+)/i,
      // Malaysian patterns - more flexible
      /\b[A-Z]{1,3}\s*\d{3,4}\s*[A-Z]?\b/g,
      /\b[A-Z]{2,3}\s*\d{4}\b/g,
    ]

    for (const pattern of patterns) {
      const match = output.match(pattern)
      if (match && match[1]) {
        const plate = match[1].trim().replace(/\s+/g, ' ')
        if (plate.length >= 3 && plate.length <= 12) {
          return plate
        }
      }
    }

    // Fallback: look for standalone plate patterns in the text
    const standalonePatterns = [
      /\b[A-Z]{2,3}\s*\d{3,4}\s*[A-Z]?\b/g,
      /\b[A-Z]{1,3}\s*\d{3,4}\s*[A-Z]?\b/g,
    ]

    for (const pattern of standalonePatterns) {
      const matches = output.match(pattern)
      if (matches) {
        for (const match of matches) {
          const plate = match.trim().replace(/\s+/g, ' ')
          if (plate.length >= 3 && plate.length <= 12) {
            return plate
          }
        }
      }
    }

    return null
  }

  private extractVehicleType(output: string): string | null {
    const types = [
      'car',
      'truck',
      'suv',
      'van',
      'motorcycle',
      'sedan',
      'hatchback',
      'coupe',
      'convertible',
      'pickup',
    ]
    const lowerOutput = output.toLowerCase()

    for (const type of types) {
      if (lowerOutput.includes(type)) {
        return type
      }
    }

    return null
  }

  private extractMakeModel(output: string): { make: string | null; model: string | null } {
    // Common car makes
    const makes = [
      'toyota',
      'honda',
      'nissan',
      'mazda',
      'bmw',
      'mercedes',
      'audi',
      'volkswagen',
      'ford',
      'chevrolet',
      'hyundai',
      'kia',
      'lexus',
      'acura',
      'infiniti',
    ]
    const lowerOutput = output.toLowerCase()

    let make: string | null = null
    let model: string | null = null

    for (const makeName of makes) {
      if (lowerOutput.includes(makeName)) {
        make = makeName.charAt(0).toUpperCase() + makeName.slice(1)
        break
      }
    }

    // Try to extract model after make
    if (make) {
      const makeIndex = lowerOutput.indexOf(make.toLowerCase())
      const afterMake = output.substring(makeIndex + make.length).trim()
      const modelMatch = afterMake.match(/^[\s,]*([A-Za-z0-9\s-]+?)[\s,.]/)
      if (modelMatch && modelMatch[1]) {
        model = modelMatch[1].trim()
      }
    }

    return { make, model }
  }

  private extractColor(output: string): string | null {
    const colors = [
      'black',
      'white',
      'silver',
      'gray',
      'grey',
      'red',
      'blue',
      'green',
      'yellow',
      'orange',
      'brown',
      'gold',
      'metallic',
      'dark',
      'light',
    ]
    const lowerOutput = output.toLowerCase()

    for (const color of colors) {
      if (lowerOutput.includes(color)) {
        return color
      }
    }

    return null
  }

  private extractYear(output: string): string | null {
    const yearMatch = output.match(/\b(19|20)\d{2}\b/)
    return yearMatch ? yearMatch[0] : null
  }

  private extractDamages(output: string): string[] {
    const damageKeywords = [
      'scratch',
      'dent',
      'damage',
      'rust',
      'crack',
      'broken',
      'missing',
      'worn',
      'faded',
      'chipped',
    ]
    const lowerOutput = output.toLowerCase()
    const damages: string[] = []

    for (const keyword of damageKeywords) {
      if (lowerOutput.includes(keyword)) {
        damages.push(keyword)
      }
    }

    return damages
  }

  private extractFeatures(output: string): string[] {
    const features: string[] = []
    const lowerOutput = output.toLowerCase()

    if (lowerOutput.includes('sunroof')) features.push('sunroof')
    if (lowerOutput.includes('spoiler')) features.push('spoiler')
    if (lowerOutput.includes('alloy')) features.push('alloy wheels')
    if (lowerOutput.includes('tinted')) features.push('tinted windows')

    return features
  }

  private parseVehicleCondition(output: string): string {
    return this.parseDetailedAnalysis(output).condition
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
