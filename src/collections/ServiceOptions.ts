import type { CollectionConfig } from 'payload'

export const ServiceOptions: CollectionConfig = {
  slug: 'service-options',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'additionalPrice', 'category', 'isActive', 'updatedAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Option Name',
      admin: {
        description: 'Name of the service option (e.g., "Tire Shine", "Wax Coating")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: {
        description: 'Detailed description of what this option includes',
      },
    },
    {
      name: 'additionalPrice',
      type: 'number',
      required: true,
      label: 'Additional Price',
      min: 0,
      admin: {
        description: 'Additional cost for this option (in your local currency)',
        step: 0.01,
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'service-categories',
      label: 'Category',
      admin: {
        description: 'Which service category this option belongs to',
      },
    },
    {
      name: 'applicableVehicleTypes',
      type: 'select',
      hasMany: true,
      label: 'Applicable Vehicle Types',
      options: [
        { label: 'Sedan', value: 'sedan' },
        { label: 'MPV/Van', value: 'mpv_van' },
        { label: 'Large Pickup', value: 'large_pickup' },
        { label: 'Regular Bike', value: 'regular_bike' },
        { label: 'Heavy Bike', value: 'heavy_bike' },
        { label: 'Very Heavy Bike', value: 'very_heavy_bike' },
      ],
      admin: {
        description: 'Vehicle types this option can be applied to (leave empty for all)',
      },
    },
    {
      name: 'estimatedMinutes',
      type: 'number',
      label: 'Estimated Minutes',
      min: 0,
      admin: {
        description: 'Additional time this option adds to the service',
      },
    },
    {
      name: 'icon',
      type: 'text',
      label: 'Icon',
      admin: {
        description: 'Lucide icon name for this option',
      },
    },
    {
      name: 'isPopular',
      type: 'checkbox',
      label: 'Popular Option',
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
        description: 'Order in which options appear (lower numbers first)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
      admin: {
        description: 'Whether this option is available for selection',
      },
    },
  ],
  access: {
    read: () => true, // Options can be read by everyone
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
