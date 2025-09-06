import type { CollectionConfig } from 'payload'

export const WhatsAppTemplates: CollectionConfig = {
  slug: 'whatsapp-templates',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'isActive', 'approvalStatus'],
    description: 'WhatsApp message templates for automated communications',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      label: 'Template Name',
      admin: {
        description: 'Internal name for this template',
      },
    },
    {
      name: 'templateId',
      type: 'text',
      required: true,
      label: 'Gupshup Template ID',
      admin: {
        description: 'Template ID from Gupshup dashboard',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Order Initiated', value: 'order_initiated' },
        { label: 'Vehicle Captured', value: 'vehicle_captured' },
        { label: 'Services Added', value: 'services_added' },
        { label: 'Payment Request', value: 'payment_request' },
        { label: 'Service Completion', value: 'completion' },
        { label: 'Welcome Message', value: 'welcome' },
        { label: 'Status Update', value: 'status_update' },
        { label: 'Error Message', value: 'error' },
        { label: 'Promotional', value: 'promotional' },
      ],
      admin: {
        description: 'Category of this template for organization',
      },
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      label: 'Template Content',
      admin: {
        description: 'Template content with variable placeholders (e.g., {{orderID}})',
      },
    },
    {
      name: 'variables',
      type: 'array',
      label: 'Template Variables',
      admin: {
        description: 'Variables that can be substituted in this template',
      },
      fields: [
        {
          name: 'variable',
          type: 'text',
          required: true,
          label: 'Variable Name',
          admin: {
            description: 'Variable name without curly braces (e.g., orderID)',
          },
        },
        {
          name: 'description',
          type: 'text',
          label: 'Description',
          admin: {
            description: 'Description of what this variable represents',
          },
        },
        {
          name: 'required',
          type: 'checkbox',
          defaultValue: true,
          label: 'Required',
          admin: {
            description: 'Whether this variable is required for the template',
          },
        },
      ],
    },
    {
      name: 'approvalStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'In Review', value: 'in_review' },
      ],
      admin: {
        description: 'WhatsApp approval status for this template',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Active',
      admin: {
        description: 'Whether this template is active and can be used',
      },
    },
    {
      name: 'language',
      type: 'select',
      required: true,
      defaultValue: 'en',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Malay', value: 'ms' },
        { label: 'Chinese', value: 'zh' },
        { label: 'Tamil', value: 'ta' },
      ],
      admin: {
        description: 'Language of this template',
      },
    },
    {
      name: 'usageCount',
      type: 'number',
      defaultValue: 0,
      label: 'Usage Count',
      admin: {
        description: 'Number of times this template has been used',
        readOnly: true,
      },
    },
    {
      name: 'lastUsed',
      type: 'date',
      label: 'Last Used',
      admin: {
        description: 'When this template was last used',
        readOnly: true,
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notes',
      admin: {
        description: 'Internal notes about this template',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        // Update usage statistics when template is used
        if (operation === 'update' && doc.usageCount !== undefined) {
          // This would be triggered by the WhatsApp service when sending messages
        }
      },
    ],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => {
      // Only staff and admins can create templates
      return user?.role === 'admin' || user?.role === 'staff'
    },
    update: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'staff'
    },
    delete: ({ req: { user } }) => {
      // Only admins can delete templates
      return user?.role === 'admin'
    },
  },
}
