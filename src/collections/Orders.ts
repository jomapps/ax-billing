import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderID',
    defaultColumns: [
      'orderID',
      'customer',
      'vehicle',
      'totalAmount',
      'paymentStatus',
      'jobStatus',
      'updatedAt',
    ],
  },
  fields: [
    {
      name: 'orderID',
      type: 'text',
      required: true,
      unique: true,
      label: 'Order ID',
      admin: {
        readOnly: true,
        description: 'Auto-generated unique order identifier',
      },
      hooks: {
        beforeValidate: [
          ({ value }) => {
            if (!value) {
              // Generate order ID: AX-YYYYMMDD-XXXX
              const date = new Date()
              const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
              const random = Math.floor(Math.random() * 9999)
                .toString()
                .padStart(4, '0')
              return `AX-${dateStr}-${random}`
            }
            return value
          },
        ],
      },
    },
    {
      name: 'orderStage',
      type: 'select',
      required: true,
      defaultValue: 'empty',
      label: 'Order Stage',
      options: [
        {
          label: 'Empty',
          value: 'empty',
        },
        {
          label: 'Initiated',
          value: 'initiated',
        },
        {
          label: 'Open',
          value: 'open',
        },
        {
          label: 'Billed',
          value: 'billed',
        },
        {
          label: 'Paid',
          value: 'paid',
        },
      ],
      admin: {
        description: 'Current stage of the order in the WhatsApp workflow',
      },
    },
    {
      name: 'whatsappLinked',
      type: 'checkbox',
      defaultValue: false,
      label: 'WhatsApp Linked',
      admin: {
        description: 'Whether this order has been linked to a WhatsApp conversation',
      },
    },
    {
      name: 'whatsappNumber',
      type: 'text',
      label: 'WhatsApp Number',
      admin: {
        description: 'WhatsApp number of the customer who initiated this order',
        condition: (data) => data.whatsappLinked,
      },
    },
    {
      name: 'qrCodeGenerated',
      type: 'checkbox',
      defaultValue: false,
      label: 'QR Code Generated',
      admin: {
        description: 'Whether a QR code has been generated for this order',
      },
    },
    {
      name: 'qrCodeScannedAt',
      type: 'date',
      label: 'QR Code Scanned At',
      admin: {
        description: 'When the customer scanned the QR code',
        condition: (data) => data.whatsappLinked,
      },
    },
    {
      name: 'vehicleCapturedAt',
      type: 'date',
      label: 'Vehicle Captured At',
      admin: {
        description: 'When the vehicle information was captured',
      },
    },
    {
      name: 'aiProcessedAt',
      type: 'date',
      label: 'AI Processed At',
      admin: {
        description: 'When AI processing of vehicle information was completed',
      },
    },
    {
      name: 'paymentLinkSentAt',
      type: 'date',
      label: 'Payment Link Sent At',
      admin: {
        description: 'When the payment link was sent via WhatsApp',
      },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      required: false, // Changed to false since empty orders won't have customers initially
      label: 'Customer',
      admin: {
        description: 'Customer who placed this order',
      },
    },
    {
      name: 'vehicle',
      type: 'relationship',
      relationTo: 'vehicles',
      required: false, // Changed to false since empty orders won't have vehicles initially
      label: 'Vehicle',
      admin: {
        description: 'Vehicle being serviced',
      },
    },
    {
      name: 'servicesRendered',
      type: 'array',
      label: 'Services & Options',
      fields: [
        {
          name: 'service',
          type: 'relationship',
          relationTo: 'services',
          required: true,
          label: 'Service',
        },
        {
          name: 'selectedOptions',
          type: 'relationship',
          relationTo: 'service-options',
          hasMany: true,
          label: 'Selected Options',
        },
        {
          name: 'servicePrice',
          type: 'number',
          required: true,
          label: 'Service Price',
          min: 0,
          admin: {
            step: 0.01,
            description: 'Final price for this service (after tier discounts)',
          },
        },
        {
          name: 'optionsPrice',
          type: 'number',
          label: 'Options Price',
          min: 0,
          defaultValue: 0,
          admin: {
            step: 0.01,
            description: 'Total price for selected options',
          },
        },
      ],
      admin: {
        description: 'Services and options included in this order',
      },
    },
    {
      name: 'totalAmount',
      type: 'number',
      required: true,
      label: 'Total Amount',
      min: 0,
      admin: {
        step: 0.01,
        description: 'Total order amount including all services and options',
      },
    },
    {
      name: 'discountAmount',
      type: 'number',
      label: 'Discount Amount',
      min: 0,
      defaultValue: 0,
      admin: {
        step: 0.01,
        description: 'Total discount applied to this order',
      },
    },
    {
      name: 'paymentStatus',
      type: 'select',
      required: true,
      label: 'Payment Status',
      defaultValue: 'pending',
      options: [
        {
          label: 'Pending',
          value: 'pending',
        },
        {
          label: 'Paid',
          value: 'paid',
        },
        {
          label: 'Failed',
          value: 'failed',
        },
        {
          label: 'Refunded',
          value: 'refunded',
        },
        {
          label: 'Cash',
          value: 'cash',
        },
      ],
    },
    {
      name: 'fiuuTransactionId',
      type: 'text',
      label: 'Fiuu Transaction ID',
      admin: {
        description: 'Transaction ID from Fiuu payment gateway',
      },
    },
    {
      name: 'queue',
      type: 'select',
      required: true,
      label: 'Queue Priority',
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
    },
    {
      name: 'jobStatus',
      type: 'array',
      label: 'Job Progress',
      fields: [
        {
          name: 'stepName',
          type: 'text',
          required: true,
          label: 'Step Name',
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Completed', value: 'completed' },
            { label: 'Skipped', value: 'skipped' },
          ],
        },
        {
          name: 'completedBy',
          type: 'relationship',
          relationTo: 'users',
          label: 'Completed By',
          admin: {
            condition: (data, siblingData) => siblingData.status === 'completed',
          },
        },
        {
          name: 'timestamp',
          type: 'date',
          label: 'Timestamp',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'notes',
          type: 'textarea',
          label: 'Notes',
        },
      ],
      admin: {
        description: 'Progress tracking for each step of the service',
      },
    },
    {
      name: 'overallStatus',
      type: 'select',
      required: true,
      label: 'Overall Status',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Ready for Pickup', value: 'ready' },
        { label: 'Picked Up', value: 'picked_up' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'estimatedCompletionTime',
      type: 'date',
      label: 'Estimated Completion Time',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'When the service is expected to be completed',
      },
    },
    {
      name: 'actualCompletionTime',
      type: 'date',
      label: 'Actual Completion Time',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'When the service was actually completed',
      },
    },
    {
      name: 'customerNotes',
      type: 'textarea',
      label: 'Customer Notes',
      admin: {
        description: 'Special requests or notes from the customer',
      },
    },
    {
      name: 'staffNotes',
      type: 'textarea',
      label: 'Staff Notes',
      admin: {
        description: 'Internal notes for staff',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Created By',
      admin: {
        description: 'Staff member who created this order',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        // Auto-calculate total amount
        if (data.servicesRendered && Array.isArray(data.servicesRendered)) {
          let total = 0
          data.servicesRendered.forEach((item: any) => {
            total += (item.servicePrice || 0) + (item.optionsPrice || 0)
          })
          data.totalAmount = total - (data.discountAmount || 0)
        }

        // Set estimated completion time based on services
        if (operation === 'create' && !data.estimatedCompletionTime) {
          // TODO: Calculate based on service steps and current queue
          const now = new Date()
          now.setHours(now.getHours() + 2) // Default 2 hours
          data.estimatedCompletionTime = now.toISOString()
        }
      },
    ],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin' || user?.role === 'staff') return true
      return {
        customer: {
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
        customer: {
          equals: user?.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
  },
}
