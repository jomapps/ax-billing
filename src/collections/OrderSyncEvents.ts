import type { CollectionConfig } from 'payload'

export const OrderSyncEvents: CollectionConfig = {
  slug: 'orderSyncEvents',
  admin: {
    useAsTitle: 'eventType',
    defaultColumns: ['order', 'eventType', 'fieldName', 'previousValue', 'newValue', 'createdAt'],
  },
  access: {
    // Comment 1: Restrict read access by role or ownership
    read: async ({ req: { user, payload } }) => {
      // Admin and staff can read all events
      if (user?.role === 'admin' || user?.role === 'staff') return true

      // Customers can only read events for their own orders
      if (user?.role === 'customer') {
        // Fetch user's order IDs and filter by order instead of nested relation path
        const userOrders = await payload.find({
          collection: 'orders',
          where: { customer: { equals: user.id } },
          depth: 0,
          pagination: false,
        })

        // Map results to flat array of order IDs
        const orderIds = userOrders.docs.map((order) => order.id)

        // If no orders found, return false to yield no results
        if (orderIds.length === 0) {
          return false
        }

        // Return where clause filtering by order IDs
        return {
          order: { in: orderIds },
        }
      }

      return false
    },
    // Comment 2: Restrict create access to trusted roles only
    create: ({ req: { user } }) => {
      // Only admin and staff can create sync events
      return user?.role === 'admin' || user?.role === 'staff'
    },
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return false
    },
    delete: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return false
    },
  },
  fields: [
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      // Comment 3: Add index for efficient queries
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Stage Change',
          value: 'stage_change',
        },
        {
          label: 'Status Update',
          value: 'status_update',
        },
        {
          label: 'Payment Update',
          value: 'payment_update',
        },
        {
          label: 'Queue Update',
          value: 'queue_update',
        },
        {
          label: 'Job Progress Update',
          value: 'job_progress_update',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'fieldName',
      type: 'text',
      // Comment 5: Make fieldName optional as it may not fit all event types
      required: false,
      admin: {
        description:
          'The order field that was changed (e.g., orderStage, paymentStatus). Optional for some event types.',
      },
      // Custom validation to require fieldName for specific event types
      validate: (value: any, { data }: { data: any }) => {
        const requiresFieldName = [
          'stage_change',
          'status_update',
          'payment_update',
          'queue_update',
        ]
        if (requiresFieldName.includes(data?.eventType) && !value) {
          return 'Field name is required for this event type'
        }
        return true
      },
    },
    {
      name: 'previousValue',
      // Comment 6: Use JSON type to handle complex values safely
      type: 'json',
      admin: {
        description:
          'The previous state value before the change (supports complex data structures)',
      },
    },
    {
      name: 'newValue',
      // Comment 6: Use JSON type to handle complex values safely
      type: 'json',
      admin: {
        description: 'The new state value after the change (supports complex data structures)',
      },
    },
    // Comment 4: Removed custom timestamp field - using built-in createdAt instead
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional event context and debugging information',
      },
    },
    {
      name: 'triggeredBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        description: 'User or system that triggered this change',
      },
    },
  ],
  // Comment 3: Add index on createdAt for efficient sorting
  timestamps: true,
}
