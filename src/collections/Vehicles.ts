import type { CollectionConfig } from 'payload'

export const Vehicles: CollectionConfig = {
  slug: 'vehicles',
  admin: {
    useAsTitle: 'licensePlate',
    defaultColumns: ['licensePlate', 'vehicleType', 'owner', 'updatedAt'],
  },
  fields: [
    {
      name: 'licensePlate',
      type: 'text',
      required: true,
      unique: true,
      label: 'License Plate',
      index: true,
      admin: {
        description: 'Vehicle license plate number',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Vehicle Image',
      admin: {
        description: 'Photo of the vehicle for AI classification',
      },
    },
    {
      name: 'vehicleType',
      type: 'select',
      required: true,
      label: 'Vehicle Type',
      options: [
        {
          label: 'Sedan',
          value: 'sedan',
        },
        {
          label: 'MPV/Van',
          value: 'mpv_van',
        },
        {
          label: 'Large Pickup',
          value: 'large_pickup',
        },
        {
          label: 'Regular Bike',
          value: 'regular_bike',
        },
        {
          label: 'Heavy Bike',
          value: 'heavy_bike',
        },
        {
          label: 'Very Heavy Bike',
          value: 'very_heavy_bike',
        },
      ],
      admin: {
        description: 'Vehicle type determined by AI or manually selected',
      },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Vehicle Owner',
      admin: {
        description: 'Customer who owns this vehicle',
      },
    },
    {
      name: 'make',
      type: 'text',
      label: 'Make',
      admin: {
        description: 'Vehicle manufacturer (e.g., Toyota, Honda)',
      },
    },
    {
      name: 'model',
      type: 'text',
      label: 'Model',
      admin: {
        description: 'Vehicle model (e.g., Camry, Civic)',
      },
    },
    {
      name: 'year',
      type: 'number',
      label: 'Year',
      admin: {
        description: 'Manufacturing year',
      },
    },
    {
      name: 'color',
      type: 'text',
      label: 'Color',
      admin: {
        description: 'Primary vehicle color',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notes',
      admin: {
        description: 'Additional notes about the vehicle',
      },
    },
    {
      name: 'aiClassificationConfidence',
      type: 'number',
      label: 'AI Classification Confidence',
      admin: {
        readOnly: true,
        description: 'Confidence score from AI classification (0-1)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
      admin: {
        description: 'Whether this vehicle is actively used by the customer',
      },
    },
    // Vehicle Images Relationship
    {
      name: 'vehicleImages',
      type: 'relationship',
      relationTo: 'vehicle-images',
      hasMany: true,
      label: 'Vehicle Images',
      admin: {
        description: 'All images captured for this vehicle during intake and delivery',
      },
    },
    // Vehicle Size Analysis
    {
      name: 'sizeAnalysis',
      type: 'group',
      label: 'Vehicle Size Analysis',
      admin: {
        description: 'AI-analyzed vehicle dimensions and size category',
      },
      fields: [
        {
          name: 'length',
          type: 'number',
          label: 'Length (meters)',
          admin: {
            description: 'Vehicle length in meters (AI estimated)',
          },
        },
        {
          name: 'width',
          type: 'number',
          label: 'Width (meters)',
          admin: {
            description: 'Vehicle width in meters (AI estimated)',
          },
        },
        {
          name: 'height',
          type: 'number',
          label: 'Height (meters)',
          admin: {
            description: 'Vehicle height in meters (AI estimated)',
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
    // Damage Assessment
    {
      name: 'damageAssessment',
      type: 'group',
      label: 'Damage Assessment',
      admin: {
        description: 'Comprehensive damage analysis from vehicle images',
      },
      fields: [
        {
          name: 'intakeDamages',
          type: 'array',
          label: 'Intake Damages',
          admin: {
            description: 'Damages detected during vehicle intake',
          },
          fields: [
            {
              name: 'description',
              type: 'textarea',
              required: true,
              label: 'Damage Description',
            },
            {
              name: 'severity',
              type: 'select',
              required: true,
              label: 'Severity',
              options: [
                { label: 'Minor', value: 'minor' },
                { label: 'Moderate', value: 'moderate' },
                { label: 'Major', value: 'major' },
                { label: 'Severe', value: 'severe' },
              ],
            },
            {
              name: 'location',
              type: 'text',
              required: true,
              label: 'Location on Vehicle',
            },
            {
              name: 'confidence',
              type: 'number',
              label: 'AI Confidence',
              min: 0,
              max: 1,
            },
            {
              name: 'relatedImage',
              type: 'relationship',
              relationTo: 'vehicle-images',
              label: 'Related Image',
            },
          ],
        },
        {
          name: 'deliveryDamages',
          type: 'array',
          label: 'Delivery Damages',
          admin: {
            description: 'Damages detected during vehicle delivery (comparison with intake)',
          },
          fields: [
            {
              name: 'description',
              type: 'textarea',
              required: true,
              label: 'Damage Description',
            },
            {
              name: 'severity',
              type: 'select',
              required: true,
              label: 'Severity',
              options: [
                { label: 'Minor', value: 'minor' },
                { label: 'Moderate', value: 'moderate' },
                { label: 'Major', value: 'major' },
                { label: 'Severe', value: 'severe' },
              ],
            },
            {
              name: 'location',
              type: 'text',
              required: true,
              label: 'Location on Vehicle',
            },
            {
              name: 'isNewDamage',
              type: 'checkbox',
              label: 'New Damage',
              admin: {
                description: 'Whether this damage occurred during service',
              },
            },
            {
              name: 'confidence',
              type: 'number',
              label: 'AI Confidence',
              min: 0,
              max: 1,
            },
            {
              name: 'relatedImage',
              type: 'relationship',
              relationTo: 'vehicle-images',
              label: 'Related Image',
            },
          ],
        },
        {
          name: 'overallCondition',
          type: 'select',
          label: 'Overall Condition',
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
          name: 'lastAssessmentDate',
          type: 'date',
          label: 'Last Assessment Date',
          admin: {
            description: 'When the damage assessment was last updated',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        // AI classification hook will be implemented in Phase 2
        if (operation === 'create' && doc.image && !doc.vehicleType) {
          // TODO: Implement AI classification via OpenRouter
          req.payload.logger.info('Vehicle created, AI classification needed')
        }
      },
    ],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin' || user?.role === 'staff') return true
      return {
        owner: {
          equals: user?.id,
        },
      }
    },
    create: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'staff'
    },
    update: ({ req: { user } }) => {
      if (user?.role === 'admin' || user?.role === 'staff') return true
      return {
        owner: {
          equals: user?.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'staff'
    },
  },
}
