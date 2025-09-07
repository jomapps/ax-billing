import type { Intake, Delivery } from '@/payload-types'

export interface DamageComparisonResult {
  newDamageDetected: boolean
  newDamageItems: Array<{
    type: string
    location: string
    severity: string
    description: string
    likelyDuringService: boolean
    confidence: number
  }>
  comparisonNotes: string
  aiProcessingStatus: 'pending' | 'completed' | 'failed'
  processedAt?: string
}

export interface DamageItem {
  type: string
  location: string
  severity: string
  description: string
  confidence?: number
}

/**
 * Compare intake and delivery images to detect new damage
 * This is a placeholder for AI-powered damage comparison
 */
export async function compareDamageImages(
  intakeImages: Array<{ url: string; angle: string; description?: string }>,
  deliveryImages: Array<{ url: string; angle: string; description?: string }>,
  intakeDamage: DamageItem[] = [],
): Promise<DamageComparisonResult> {
  try {
    // TODO: Implement actual AI image comparison
    // For now, return a mock result

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock damage detection logic
    const mockNewDamage = []

    // Simple heuristic: if delivery has more images than intake, assume potential new damage
    if (deliveryImages.length > intakeImages.length) {
      mockNewDamage.push({
        type: 'scratch',
        location: 'rear_bumper',
        severity: 'minor',
        description: 'Small scratch detected on rear bumper during AI comparison',
        likelyDuringService: true,
        confidence: 0.75,
      })
    }

    // Check for damage items that weren't in intake
    const newDamageDetected = mockNewDamage.length > 0

    return {
      newDamageDetected,
      newDamageItems: mockNewDamage,
      comparisonNotes: newDamageDetected
        ? 'AI detected potential new damage. Manual review recommended.'
        : 'No new damage detected during AI comparison.',
      aiProcessingStatus: 'completed',
      processedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Damage comparison failed:', error)
    return {
      newDamageDetected: false,
      newDamageItems: [],
      comparisonNotes: 'AI processing failed. Manual comparison required.',
      aiProcessingStatus: 'failed',
      processedAt: new Date().toISOString(),
    }
  }
}

/**
 * Generate damage assessment report
 */
export function generateDamageReport(
  intake: Intake,
  delivery: Delivery,
  comparisonResult: DamageComparisonResult,
): {
  summary: string
  recommendations: string[]
  riskLevel: 'low' | 'medium' | 'high'
  requiresCustomerNotification: boolean
} {
  const intakeDamageCount = intake.damageAssessment?.existingDamage?.length || 0
  const newDamageCount = comparisonResult.newDamageItems.length

  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  let requiresCustomerNotification = false

  if (newDamageCount > 0) {
    const severeDamage = comparisonResult.newDamageItems.some(
      (item) => item.severity === 'major' || item.severity === 'severe',
    )

    if (severeDamage) {
      riskLevel = 'high'
      requiresCustomerNotification = true
    } else if (newDamageCount > 2) {
      riskLevel = 'medium'
      requiresCustomerNotification = true
    } else {
      riskLevel = 'low'
      requiresCustomerNotification = true // Always notify for any new damage
    }
  }

  const summary = `Vehicle inspection completed. ${intakeDamageCount} pre-existing damage items documented. ${newDamageCount} new damage items detected during service.`

  const recommendations = []

  if (newDamageCount > 0) {
    recommendations.push('Contact customer immediately to discuss new damage')
    recommendations.push('Document all new damage with detailed photos')
    recommendations.push('Review service procedures to prevent future damage')
  }

  if (riskLevel === 'high') {
    recommendations.push('Consider offering compensation or repair services')
    recommendations.push('Escalate to management for review')
  }

  if (comparisonResult.aiProcessingStatus === 'failed') {
    recommendations.push('Perform manual damage comparison')
    recommendations.push('Review AI system for technical issues')
  }

  return {
    summary,
    recommendations,
    riskLevel,
    requiresCustomerNotification,
  }
}

/**
 * Format damage items for display
 */
export function formatDamageItems(damageItems: DamageItem[]): string {
  if (!damageItems || damageItems.length === 0) {
    return 'No damage items recorded'
  }

  return damageItems
    .map(
      (item, index) =>
        `${index + 1}. ${item.type.toUpperCase()} - ${item.location.replace(/_/g, ' ')} (${item.severity}): ${item.description}`,
    )
    .join('\n')
}

/**
 * Calculate damage severity score
 */
export function calculateDamageSeverityScore(damageItems: DamageItem[]): number {
  if (!damageItems || damageItems.length === 0) return 0

  const severityWeights = {
    minor: 1,
    moderate: 3,
    major: 7,
    severe: 10,
  }

  const totalScore = damageItems.reduce((score, item) => {
    const weight = severityWeights[item.severity as keyof typeof severityWeights] || 1
    return score + weight
  }, 0)

  return Math.min(totalScore, 100) // Cap at 100
}

/**
 * Generate customer notification message
 */
export function generateCustomerNotification(
  orderID: string,
  newDamageItems: DamageItem[],
  riskLevel: 'low' | 'medium' | 'high',
): {
  subject: string
  message: string
  urgency: 'low' | 'medium' | 'high'
} {
  const damageCount = newDamageItems.length
  const severeDamage = newDamageItems.some(
    (item) => item.severity === 'major' || item.severity === 'severe',
  )

  let subject = `Order ${orderID}: Vehicle Inspection Update`
  let urgency: 'low' | 'medium' | 'high' = 'low'

  if (riskLevel === 'high' || severeDamage) {
    subject = `URGENT - Order ${orderID}: New Damage Detected`
    urgency = 'high'
  } else if (riskLevel === 'medium') {
    subject = `Order ${orderID}: Multiple New Damage Items Found`
    urgency = 'medium'
  }

  const damageList = newDamageItems
    .map((item) => `• ${item.type} on ${item.location.replace(/_/g, ' ')} (${item.severity})`)
    .join('\n')

  const message = `Dear Customer,

We have completed the service for your vehicle (Order: ${orderID}).

During our post-service inspection, we detected ${damageCount} new damage item${damageCount > 1 ? 's' : ''} that were not present during intake:

${damageList}

${
  riskLevel === 'high'
    ? 'This damage requires immediate attention. Please contact us urgently to discuss next steps.'
    : 'We take full responsibility for any damage that occurred during service. Please contact us to discuss resolution options.'
}

We sincerely apologize for any inconvenience and are committed to resolving this matter promptly.

Best regards,
AX Car Wash Team`

  return {
    subject,
    message,
    urgency,
  }
}
