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
