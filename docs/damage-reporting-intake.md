# Damage Reporting During Intake

## Overview

This document describes the automatic damage reporting system that sends comprehensive damage assessments and terms & conditions to customers immediately after vehicle intake is completed.

## Features

### 1. Automatic Damage Detection & Reporting
- **AI-Powered Analysis**: All captured images are analyzed for damage detection
- **Comprehensive Reports**: Detailed damage assessment with location and severity
- **Immediate Notification**: Customer receives report via WhatsApp immediately after intake

### 2. Terms & Conditions Integration
- **Mandatory Disclaimer**: Every intake report includes terms & conditions
- **Clear Warning**: Explicit message about liability limitations
- **Legal Protection**: Ensures customers acknowledge terms before service begins

### 3. Image Documentation
- **Public URLs**: All intake photos are provided with direct links
- **Multiple Views**: Front, back, left, right side documentation
- **Permanent Record**: Images stored for future reference and disputes

## Implementation

### Multi-Image Capture Route
**File**: `src/app/api/v1/staff/capture-vehicle-multi/route.ts`

**Trigger**: After AI analysis completion and vehicle number assignment
**Condition**: Only during intake stage (`captureStage === 'intake'`)

### Single Image Capture Route  
**File**: `src/app/api/v1/staff/capture-vehicle/route.ts`

**Trigger**: After vehicle information capture
**Note**: Limited damage assessment (single image only)

## Message Format

### With Damage Detected
```
🚗 *VEHICLE INTAKE COMPLETED*

Order ID: *AX-20250907-0699*
Vehicle: *ABC1234*
Overall Condition: *FAIR*

📋 *DAMAGE ASSESSMENT:*
1. Minor scratch on front bumper
   📍 Location: front bumper left side
   ⚠️ Severity: MINOR

2. Small dent on rear door
   📍 Location: rear passenger door
   ⚠️ Severity: MODERATE

📸 *INTAKE PHOTOS:*
1. FRONT VIEW: https://media.ft.tc/media/vehicle-front-123.jpg
2. BACK VIEW: https://media.ft.tc/media/vehicle-back-123.jpg
3. LEFT VIEW: https://media.ft.tc/media/vehicle-left-123.jpg
4. RIGHT VIEW: https://media.ft.tc/media/vehicle-right-123.jpg

⚠️ *IMPORTANT TERMS & CONDITIONS* ⚠️

*DO NOT AVAIL OUR SERVICES* if you do not agree with our terms and conditions detailed here: https://axcarwash.com/terms-conditions/

*ESSENTIALLY we do not take responsibility for damage, stolen goods or accidents that may happen while we operate your vehicle.*

By proceeding with our service, you acknowledge and accept these terms.

Thank you for choosing AX Car Wash! 🚗✨
```

### No Damage Detected
```
🚗 *VEHICLE INTAKE COMPLETED*

Order ID: *AX-20250907-0699*
Vehicle: *ABC1234*
Overall Condition: *GOOD*

✅ *NO VISIBLE DAMAGE DETECTED*

📸 *INTAKE PHOTOS:*
1. FRONT VIEW: https://media.ft.tc/media/vehicle-front-123.jpg
2. BACK VIEW: https://media.ft.tc/media/vehicle-back-123.jpg
3. LEFT VIEW: https://media.ft.tc/media/vehicle-left-123.jpg
4. RIGHT VIEW: https://media.ft.tc/media/vehicle-right-123.jpg

⚠️ *IMPORTANT TERMS & CONDITIONS* ⚠️

*DO NOT AVAIL OUR SERVICES* if you do not agree with our terms and conditions detailed here: https://axcarwash.com/terms-conditions/

*ESSENTIALLY we do not take responsibility for damage, stolen goods or accidents that may happen while we operate your vehicle.*

By proceeding with our service, you acknowledge and accept these terms.

Thank you for choosing AX Car Wash! 🚗✨
```

## Technical Details

### Damage Analysis Structure
```typescript
interface DamageItem {
  damageDescription: string
  severity: 'minor' | 'moderate' | 'major' | 'severe'
  location: string
  confidence: number
}
```

### Image URL Structure
```typescript
interface ImageUrl {
  imageType: string  // 'front', 'back', 'left', 'right', etc.
  imageUrl: string   // Full public URL to image
}
```

### WhatsApp Message Logging
- All messages are logged in `whatsapp-messages` collection
- Message ID format: `intake_damage_report_{orderId}_{timestamp}`
- Status tracking for delivery confirmation

## Error Handling

### Non-Critical Failures
- WhatsApp sending failures don't stop the intake process
- Errors are logged but vehicle capture continues
- Staff can manually resend reports if needed

### Fallback Behavior
- If AI analysis fails, basic vehicle info is still sent
- Manual damage assessment can be added later
- Terms & conditions are always included regardless

## Configuration

### Environment Variables
- `WHATSAPP_ENABLED`: Enable/disable WhatsApp notifications
- `S3_PUBLIC_BUCKET`: Base URL for public image access
- `GUPSHUP_*`: WhatsApp service configuration

### Terms & Conditions URL
- Currently hardcoded: `https://axcarwash.com/terms-conditions/`
- Can be made configurable via environment variable if needed

## Benefits

### Legal Protection
- Clear documentation of pre-existing damage
- Customer acknowledgment of terms before service
- Permanent record with timestamps and images

### Customer Transparency
- Immediate damage disclosure
- Full photo documentation
- Clear terms and expectations

### Operational Efficiency
- Automated reporting reduces manual work
- Consistent message format
- Integrated with existing workflow

## Future Enhancements

### Planned Features
1. **Damage Comparison**: Compare intake vs delivery photos
2. **Insurance Integration**: Export reports for insurance claims
3. **Customer Confirmation**: Require customer acknowledgment
4. **Multi-language Support**: Terms in multiple languages
5. **Template Management**: Configurable message templates
