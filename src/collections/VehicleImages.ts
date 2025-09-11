import type { CollectionConfig } from 'payload'

export const VehicleImages: CollectionConfig = {
  slug: 'vehicle-images',
  admin: {
    useAsTitle: 'imageType',
    defaultColumns: ['imageType', 'vehicle', 'damageDetected', 'aiProcessed', 'createdAt'],
    group: 'Vehicle Management',
  },
  fields: [
    {
      name: 'vehicle',
      type: 'relationship',
      relationTo: 'vehicles',
      required: true,
      label: 'Vehicle',
      admin: {
        description: 'Vehicle this image belongs to',
      },
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      label: 'Order',
      admin: {
        description: 'Order during which this image was captured',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Vehicle Image',
      admin: {
        description: 'The actual vehicle image file',
      },
    },
    {
      name: 'imageType',
      type: 'select',
      required: true,
      label: 'Image Type',
      options: [
        { label: 'Front View', value: 'front' },
        { label: 'Back View', value: 'back' },
        { label: 'Left Side', value: 'left' },
        { label: 'Right Side', value: 'right' },
        { label: 'Interior', value: 'interior' },
        { label: 'Damage Close-up', value: 'damage' },
        { label: 'License Plate', value: 'license_plate' },
        { label: 'Additional', value: 'additional' },
      ],
      admin: {
        description: 'Type/angle of the vehicle image',
      },
    },
    {
      name: 'captureStage',
      type: 'select',
      required: true,
      label: 'Capture Stage',
      options: [
        { label: 'Intake (Before Service)', value: 'intake' },
        { label: 'Delivery (After Service)', value: 'delivery' },
      ],
      admin: {
        description: 'Whether this image was taken during intake or delivery',
      },
    },
    {
      name: 'aiProcessed',
      type: 'checkbox',
      label: 'AI Processed',
      defaultValue: false,
      admin: {
        description: 'Whether this image has been processed by AI for analysis',
      },
    },
    {
      name: 'damageDetected',
      type: 'checkbox',
      label: 'Damage Detected',
      defaultValue: false,
      admin: {
        description: 'Whether AI detected damage in this image',
      },
    },
    {
      name: 'damageDescription',
      type: 'textarea',
      label: 'Damage Description',
      admin: {
        description: 'AI-generated description of any damage found in the image',
        condition: (data) => data.damageDetected,
      },
    },
    {
      name: 'damageConfidence',
      type: 'number',
      label: 'Damage Detection Confidence',
      min: 0,
      max: 1,
      admin: {
        description: 'AI confidence score for damage detection (0-1)',
        condition: (data) => data.damageDetected,
      },
    },
    {
      name: 'extractedText',
      type: 'text',
      label: 'Extracted Text',
      admin: {
        description: 'Any text extracted from the image (license plates, etc.)',
      },
    },
    {
      name: 'vehicleSize',
      type: 'group',
      label: 'Vehicle Size Analysis',
      admin: {
        description: 'AI analysis of vehicle dimensions and size',
      },
      fields: [
        {
          name: 'estimatedLength',
          type: 'number',
          label: 'Estimated Length (meters)',
          admin: {
            description: 'AI estimated vehicle length in meters',
          },
        },
        {
          name: 'estimatedWidth',
          type: 'number',
          label: 'Estimated Width (meters)',
          admin: {
            description: 'AI estimated vehicle width in meters',
          },
        },
        {
          name: 'estimatedHeight',
          type: 'number',
          label: 'Estimated Height (meters)',
          admin: {
            description: 'AI estimated vehicle height in meters',
          },
        },
        {
          name: 'sizeCategory',
          type: 'select',
          label: 'Size Category',
          options: [
            { label: 'Compact', value: 'compact' },
            { label: 'Mid-size', value: 'midsize' },
            { label: 'Large', value: 'large' },
            { label: 'Extra Large', value: 'extra_large' },
          ],
          admin: {
            description: 'AI-determined vehicle size category',
          },
        },
        {
          name: 'confidence',
          type: 'number',
          label: 'Size Analysis Confidence',
          min: 0,
          max: 1,
          admin: {
            description: 'AI confidence score for size analysis (0-1)',
          },
        },
      ],
    },
    {
      name: 'aiAnalysis',
      type: 'group',
      label: 'AI Analysis Results',
      admin: {
        description: 'Comprehensive AI analysis of the vehicle image',
      },
      fields: [
        {
          name: 'vehicleCondition',
          type: 'select',
          label: 'Overall Vehicle Condition',
          options: [
            { label: 'Excellent', value: 'excellent' },
            { label: 'Good', value: 'good' },
            { label: 'Fair', value: 'fair' },
            { label: 'Poor', value: 'poor' },
            { label: 'Damaged', value: 'damaged' },
          ],
          admin: {
            description: 'AI assessment of overall vehicle condition',
          },
        },
        {
          name: 'visibleFeatures',
          type: 'array',
          label: 'Visible Features',
          admin: {
            description: 'List of vehicle features visible in this image',
          },
          fields: [
            {
              name: 'feature',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          name: 'colorAnalysis',
          type: 'text',
          label: 'Color Analysis',
          admin: {
            description: 'AI analysis of vehicle color(s)',
          },
        },
        {
          name: 'processingTime',
          type: 'number',
          label: 'Processing Time (seconds)',
          admin: {
            description: 'Time taken for AI processing in seconds',
          },
        },
        {
          name: 'rawAiResponse',
          type: 'json',
          label: 'Raw AI Response',
          admin: {
            description: 'Complete raw response from AI service for debugging',
          },
        },
      ],
    },
    {
      name: 'metadata',
      type: 'group',
      label: 'Image Metadata',
      admin: {
        description: 'Technical metadata about the image capture',
      },
      fields: [
        {
          name: 'capturedBy',
          type: 'relationship',
          relationTo: 'users',
          label: 'Captured By',
          admin: {
            description: 'Staff member who captured this image',
          },
        },
        {
          name: 'captureDevice',
          type: 'text',
          label: 'Capture Device',
          admin: {
            description: 'Device used to capture the image (camera, phone, etc.)',
          },
        },
        {
          name: 'gpsLocation',
          type: 'point',
          label: 'GPS Location',
          admin: {
            description: 'GPS coordinates where the image was captured',
          },
        },
        {
          name: 'weather',
          type: 'text',
          label: 'Weather Conditions',
          admin: {
            description: 'Weather conditions during image capture',
          },
        },
        {
          name: 'lighting',
          type: 'select',
          label: 'Lighting Conditions',
          options: [
            { label: 'Daylight', value: 'daylight' },
            { label: 'Artificial Light', value: 'artificial' },
            { label: 'Low Light', value: 'low_light' },
            { label: 'Night', value: 'night' },
          ],
          admin: {
            description: 'Lighting conditions during capture',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'create') {
          req.payload.logger.info(`Vehicle image created: ${doc.id} for vehicle ${doc.vehicle}`)
        }
      },
    ],
  },
}
