import type { CollectionConfig } from 'payload'

export const CustomerTiers: CollectionConfig = {
  slug: 'customer-tiers',
  admin: {
    useAsTitle: 'tierName',
    defaultColumns: ['tierName', 'defaultQueue', 'discountPercentage', 'isActive', 'updatedAt'],
  },
  fields: [
    {
      name: 'tierName',
      type: 'text',
      required: true,
      unique: true,
      label: 'Tier Name',
      admin: {
        description: 'Name of the customer tier (e.g., "Standard", "Fleet", "VIP Member")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: {
        description: 'Description of the benefits and features of this tier',
      },
    },
    {
      name: 'defaultQueue',
      type: 'select',
      required: true,
      label: 'Default Queue',
      defaultValue: 'regular',
      options: [
        {
          label: 'Regular',
          value: 'regular',
        },
        {
          label: 'VIP',
          value: 'vip',
        },
        {
          label: 'Remnant',
          value: 'remnant',
        },
      ],
      admin: {
        description: 'Default queue priority for customers in this tier',
      },
    },
    {
      name: 'discountPercentage',
      type: 'number',
      label: 'Discount Percentage',
      min: 0,
      max: 100,
      defaultValue: 0,
      admin: {
        description: 'General discount percentage for this tier (0-100)',
        step: 0.1,
      },
    },
    {
      name: 'pricingOverrides',
      type: 'array',
      label: 'Service Pricing Overrides',
      fields: [
        {
          name: 'service',
          type: 'relationship',
          relationTo: 'services',
          required: true,
          label: 'Service',
        },
        {
          name: 'overriddenPrice',
          type: 'number',
          required: true,
          label: 'Override Price',
          min: 0,
          admin: {
            step: 0.01,
          },
        },
        {
          name: 'discountPercentage',
          type: 'number',
          label: 'Discount Percentage',
          min: 0,
          max: 100,
          admin: {
            description: 'Alternative to fixed price - percentage discount',
            step: 0.1,
          },
        },
      ],
      admin: {
        description: 'Specific pricing overrides for individual services',
      },
    },
    {
      name: 'benefits',
      type: 'array',
      label: 'Tier Benefits',
      fields: [
        {
          name: 'benefit',
          type: 'text',
          required: true,
          label: 'Benefit Description',
        },
        {
          name: 'icon',
          type: 'text',
          label: 'Icon',
          admin: {
            description: 'Lucide icon name for this benefit',
          },
        },
      ],
      admin: {
        description: 'List of benefits for this tier',
      },
    },
    {
      name: 'color',
      type: 'select',
      label: 'Tier Color',
      defaultValue: 'blue',
      options: [
        { label: 'Blue', value: 'blue' },
        { label: 'Purple', value: 'purple' },
        { label: 'Green', value: 'green' },
        { label: 'Pink', value: 'pink' },
        { label: 'Orange', value: 'orange' },
        { label: 'Gold', value: 'gold' },
        { label: 'Silver', value: 'silver' },
      ],
      admin: {
        description: 'Color theme for this tier in the UI',
      },
    },
    {
      name: 'minimumSpend',
      type: 'number',
      label: 'Minimum Spend Requirement',
      min: 0,
      admin: {
        description: 'Minimum total spend required to qualify for this tier',
        step: 0.01,
      },
    },
    {
      name: 'autoUpgrade',
      type: 'checkbox',
      label: 'Auto Upgrade',
      defaultValue: false,
      admin: {
        description: 'Automatically upgrade customers who meet the minimum spend',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Sort Order',
      defaultValue: 0,
      admin: {
        description: 'Order in which tiers appear (lower numbers first)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
      admin: {
        description: 'Whether this tier is available for assignment',
      },
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'staff'
    },
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
