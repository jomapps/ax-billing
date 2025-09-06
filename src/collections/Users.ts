import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    // Email added by default
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'customer',
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Staff',
          value: 'staff',
        },
        {
          label: 'Customer',
          value: 'customer',
        },
      ],
    },
    {
      name: 'whatsappNumber',
      type: 'text',
      label: 'WhatsApp Number',
      validate: (val: string) => {
        if (val && !/^\+?[1-9]\d{1,14}$/.test(val)) {
          return 'Please enter a valid WhatsApp number'
        }
        return true
      },
    },
    {
      name: 'whatsappVerified',
      type: 'checkbox',
      defaultValue: false,
      label: 'WhatsApp Verified',
      admin: {
        description: 'Whether the WhatsApp number has been verified through conversation',
      },
    },
    {
      name: 'whatsappOptIn',
      type: 'checkbox',
      defaultValue: true,
      label: 'WhatsApp Opt-in',
      admin: {
        description: 'User consent for receiving WhatsApp notifications',
      },
    },
    {
      name: 'lastWhatsappContact',
      type: 'date',
      label: 'Last WhatsApp Contact',
      admin: {
        description: 'Last time customer initiated WhatsApp contact (for 24h messaging window)',
      },
    },
    {
      name: 'whatsappConversationId',
      type: 'text',
      label: 'WhatsApp Conversation ID',
      admin: {
        description: 'Gupshup conversation identifier for this user',
      },
    },
    {
      name: 'firebaseUID',
      type: 'text',
      label: 'Firebase UID',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'customerTier',
      type: 'relationship',
      relationTo: 'customer-tiers',
      label: 'Customer Tier',
      admin: {
        condition: (data) => data.role === 'customer',
      },
    },
    {
      name: 'firstName',
      type: 'text',
      label: 'First Name',
    },
    {
      name: 'lastName',
      type: 'text',
      label: 'Last Name',
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      if (user?.role === 'staff') return true
      return {
        id: {
          equals: user?.id,
        },
      }
    },
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return {
        id: {
          equals: user?.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
  },
}
