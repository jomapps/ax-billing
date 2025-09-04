import type { CollectionConfig } from 'payload'

export const ServiceCategories: CollectionConfig = {
  slug: 'service-categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'description', 'isActive', 'updatedAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      label: 'Category Name',
      admin: {
        description: 'Name of the service category (e.g., "Exterior Wash", "Interior Detailing")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: {
        description: 'Brief description of what this category includes',
      },
    },
    {
      name: 'icon',
      type: 'text',
      label: 'Icon',
      admin: {
        description: 'Lucide icon name for the category (e.g., "car", "sparkles")',
      },
    },
    {
      name: 'color',
      type: 'select',
      label: 'Theme Color',
      defaultValue: 'blue',
      options: [
        { label: 'Blue', value: 'blue' },
        { label: 'Purple', value: 'purple' },
        { label: 'Green', value: 'green' },
        { label: 'Pink', value: 'pink' },
        { label: 'Orange', value: 'orange' },
      ],
      admin: {
        description: 'Color theme for this category in the UI',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Sort Order',
      defaultValue: 0,
      admin: {
        description: 'Order in which categories appear (lower numbers first)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
      admin: {
        description: 'Whether this category is available for selection',
      },
    },
  ],
  access: {
    read: () => true, // Categories can be read by everyone
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
