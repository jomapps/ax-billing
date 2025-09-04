import type { CollectionConfig } from 'payload'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'basePrice', 'estimatedMinutes', 'isActive', 'updatedAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Service Name',
      admin: {
        description: 'Name of the service (e.g., "Basic Wash", "Premium Detail")',
      },
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      admin: {
        description: 'Detailed description of what this service includes',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'service-categories',
      required: true,
      label: 'Category',
      admin: {
        description: 'Which category this service belongs to',
      },
    },
    {
      name: 'basePrice',
      type: 'number',
      required: true,
      label: 'Base Price',
      min: 0,
      admin: {
        description: 'Base price for this service (in your local currency)',
        step: 0.01,
      },
    },
    {
      name: 'vehicleTypePricing',
      type: 'array',
      label: 'Vehicle Type Pricing',
      fields: [
        {
          name: 'vehicleType',
          type: 'select',
          required: true,
          options: [
            { label: 'Sedan', value: 'sedan' },
            { label: 'MPV/Van', value: 'mpv_van' },
            { label: 'Large Pickup', value: 'large_pickup' },
            { label: 'Regular Bike', value: 'regular_bike' },
            { label: 'Heavy Bike', value: 'heavy_bike' },
            { label: 'Very Heavy Bike', value: 'very_heavy_bike' },
          ],
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            step: 0.01,
          },
        },
      ],
      admin: {
        description: 'Different pricing for different vehicle types (overrides base price)',
      },
    },
    {
      name: 'steps',
      type: 'array',
      label: 'Service Steps',
      fields: [
        {
          name: 'stepName',
          type: 'text',
          required: true,
          label: 'Step Name',
        },
        {
          name: 'estimatedMinutes',
          type: 'number',
          required: true,
          label: 'Estimated Minutes',
          min: 1,
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Step Description',
        },
        {
          name: 'sortOrder',
          type: 'number',
          label: 'Order',
          defaultValue: 0,
        },
      ],
      admin: {
        description: 'Individual steps that make up this service',
      },
    },
    {
      name: 'compatibleOptions',
      type: 'relationship',
      relationTo: 'service-options',
      hasMany: true,
      label: 'Compatible Options',
      admin: {
        description: 'Service options that can be added to this service',
      },
    },
    {
      name: 'estimatedMinutes',
      type: 'number',
      required: true,
      label: 'Total Estimated Minutes',
      min: 1,
      admin: {
        description: 'Total estimated time for this service',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Service Image',
      admin: {
        description: 'Image representing this service',
      },
    },
    {
      name: 'icon',
      type: 'text',
      label: 'Icon',
      admin: {
        description: 'Lucide icon name for this service',
      },
    },
    {
      name: 'isPopular',
      type: 'checkbox',
      label: 'Popular Service',
      defaultValue: false,
      admin: {
        description: 'Mark as popular to highlight in the UI',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Sort Order',
      defaultValue: 0,
      admin: {
        description: 'Order in which services appear (lower numbers first)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
      admin: {
        description: 'Whether this service is available for booking',
      },
    },
  ],
  access: {
    read: () => true, // Services can be read by everyone
    create: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
    update: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
    delete: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
  },
}
