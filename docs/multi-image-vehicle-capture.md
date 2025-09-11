# Multi-Image Vehicle Capture System

## Overview

This document describes the comprehensive multi-image vehicle capture system implemented for the AX Billing application. The system captures multiple vehicle images, analyzes them with AI for damage detection, vehicle size estimation, and license plate recognition.

## Features

### 1. Multi-Image Capture
- **Required Images**: Front, Back, Left Side, Right Side (minimum 4 images)
- **Optional Images**: Damage close-ups, Interior, License plate close-up, Additional photos
- **Progressive Capture**: Guides users through capturing each required image type
- **Real-time Preview**: Shows captured images with type labels and damage indicators

### 2. AI Analysis
- **Vehicle Number Recognition**: Extracts license plate text from multiple angles
- **Vehicle Size Analysis**: Estimates length, width, height, and size category
- **Damage Detection**: Identifies and describes damage with severity levels
- **Overall Condition Assessment**: Provides comprehensive vehicle condition rating
- **Color Analysis**: Analyzes vehicle color and visible features

### 3. Database Schema

#### VehicleImages Collection
```typescript
{
  vehicle: Relationship<Vehicle>
  order: Relationship<Order>
  image: Relationship<Media>
  imageType: 'front' | 'back' | 'left' | 'right' | 'interior' | 'damage' | 'license_plate' | 'additional'
  captureStage: 'intake' | 'delivery'
  aiProcessed: boolean
  damageDetected: boolean
  damageDescription?: string
  damageConfidence?: number
  extractedText?: string
  vehicleSize?: {
    estimatedLength: number
    estimatedWidth: number
    estimatedHeight: number
    sizeCategory: string
    confidence: number
  }
  aiAnalysis?: {
    vehicleCondition: string
    visibleFeatures: Array<{feature: string}>
    colorAnalysis: string
    processingTime: number
    rawAiResponse: any
  }
  metadata?: {
    capturedBy: Relationship<User>
    captureDevice: string
    gpsLocation: Point
    weather: string
    lighting: string
  }
}
```

#### Enhanced Vehicles Collection
```typescript
{
  // Existing fields...
  vehicleImages: Relationship<VehicleImage[]>
  sizeAnalysis?: {
    length: number
    width: number
    height: number
    sizeCategory: string
    confidence: number
  }
  damageAssessment?: {
    intakeDamages: Array<{
      description: string
      severity: 'minor' | 'moderate' | 'major' | 'severe'
      location: string
      confidence: number
      relatedImage: Relationship<VehicleImage>
    }>
    deliveryDamages: Array<{
      description: string
      severity: 'minor' | 'moderate' | 'major' | 'severe'
      location: string
      isNewDamage: boolean
      confidence: number
      relatedImage: Relationship<VehicleImage>
    }>
    overallCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
    lastAssessmentDate: Date
  }
}
```

## API Endpoints

### POST /api/v1/staff/capture-vehicle-multi
Processes multiple vehicle images and performs comprehensive AI analysis.

**Request:**
```typescript
FormData {
  orderId: string
  captureStage: 'intake' | 'delivery'
  imageCount: number
  image_0: File
  imageType_0: string
  image_1: File
  imageType_1: string
  // ... additional images
}
```

**Response:**
```typescript
{
  success: boolean
  vehicle: Vehicle
  vehicleImages: VehicleImage[]
  analysisResult: {
    vehicleNumber?: string
    consolidatedSizeAnalysis?: VehicleSizeAnalysis
    allDamages?: DamageAnalysis[]
    overallCondition?: string
    imageAnalyses?: { [imageId: string]: VehicleAnalysisResult }
  }
  processedImages: number
  message: string
}
```

## Components

### 1. MultiImageVehicleCaptureInterface
- **Location**: `src/components/whatsapp/MultiImageVehicleCaptureInterface.tsx`
- **Purpose**: Main interface for capturing multiple vehicle images
- **Features**:
  - Progress tracking for required images
  - Image type selection and guidance
  - Real-time preview with damage indicators
  - Batch processing of all images

### 2. VehicleAnalysisDisplay
- **Location**: `src/components/vehicles/VehicleAnalysisDisplay.tsx`
- **Purpose**: Comprehensive display of vehicle analysis results
- **Features**:
  - Tabbed interface (Images, Damage Analysis, AI Analysis)
  - Image gallery with modal view
  - Damage assessment with severity indicators
  - AI analysis results with confidence scores

### 3. Enhanced VehicleInfoCard
- **Location**: `src/components/orders/shared/VehicleInfoCard.tsx`
- **Purpose**: Updated vehicle info card with analysis summary
- **Features**:
  - Analysis summary with key metrics
  - Quick access to detailed analysis
  - Damage and size analysis indicators

## Services

### 1. VehicleDamageAnalysisService
- **Location**: `src/lib/whatsapp/vehicle-damage-analysis-service.ts`
- **Purpose**: AI-powered analysis of vehicle images
- **Methods**:
  - `analyzeVehicleImage()`: Analyze single image
  - `analyzeMultipleImages()`: Consolidate analysis from multiple images
  - `parseAiResponse()`: Parse and structure AI responses

## Usage Flow

### 1. Vehicle Intake Process
1. Customer scans QR code and order moves to "initiated" stage
2. Staff clicks "Start Multi-Image Capture"
3. System guides through capturing 4 required images (front, back, left, right)
4. Optional additional images can be captured (damage, interior, etc.)
5. All images are processed with AI for comprehensive analysis
6. Results are stored in database and displayed to staff

### 2. Vehicle Delivery Process
1. When order is ready for delivery, staff captures new set of images
2. System compares delivery images with intake images
3. New damages are identified and flagged
4. Delivery condition is assessed and recorded

## AI Analysis Features

### 1. License Plate Recognition
- Extracts text from multiple angles
- Consolidates results for highest accuracy
- Handles various lighting conditions and angles

### 2. Vehicle Size Estimation
- Estimates physical dimensions (length, width, height)
- Categorizes vehicle size (compact, midsize, large, extra large)
- Provides confidence scores for accuracy assessment

### 3. Damage Detection
- Identifies various types of damage (scratches, dents, cracks, etc.)
- Assesses severity levels (minor, moderate, major, severe)
- Provides detailed descriptions and locations
- Tracks damage progression between intake and delivery

### 4. Overall Condition Assessment
- Evaluates overall vehicle condition
- Considers all detected damages and their severity
- Provides standardized condition ratings

## Configuration

### Environment Variables
```bash
FAL_KEY=your_fal_ai_api_key
FAL_VISION_MODEL=fal-ai/moondream2/visual-query
S3_PUBLIC_BUCKET=https://your-public-bucket-url
```

### Required Dependencies
- `@radix-ui/react-progress`: Progress bar component
- `@fal-ai/client`: AI image analysis
- `axios`: HTTP requests for AI API

## Testing

### Manual Testing
1. Run the development server: `pnpm run dev`
2. Navigate to an initiated order: `http://localhost:3001/order/AX-XXXXXXXX-XXXX/initiated`
3. Click "Start Multi-Image Capture"
4. Upload or capture test images for each required type
5. Review analysis results

### API Testing
```bash
node scripts/test-multi-image-capture.mjs
```

## Future Enhancements

1. **Real-time Camera Integration**: Direct camera access for mobile devices
2. **Damage Comparison**: Visual diff between intake and delivery images
3. **Insurance Integration**: Export damage reports for insurance claims
4. **Machine Learning Improvements**: Train custom models for better accuracy
5. **Batch Processing**: Process multiple vehicles simultaneously
6. **Quality Assurance**: Image quality checks before processing

## Troubleshooting

### Common Issues

1. **AI Processing Fails**
   - Check FAL_KEY environment variable
   - Verify image URLs are publicly accessible
   - Check network connectivity

2. **Images Not Uploading**
   - Verify S3 configuration
   - Check file size limits (10MB max)
   - Ensure proper MIME types

3. **Database Errors**
   - Verify MongoDB connection
   - Check collection relationships
   - Ensure proper data validation

### Debug Mode
Enable detailed logging by setting:
```bash
DEBUG=vehicle-capture:*
```

## Performance Considerations

1. **Image Optimization**: Images are automatically resized and optimized
2. **Parallel Processing**: Multiple images processed concurrently
3. **Caching**: AI results cached to avoid reprocessing
4. **Progressive Loading**: Images loaded progressively for better UX
5. **Error Handling**: Graceful degradation when AI services are unavailable
