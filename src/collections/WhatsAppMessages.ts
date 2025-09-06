import type { CollectionConfig } from 'payload'

export const WhatsAppMessages: CollectionConfig = {
  slug: 'whatsapp-messages',
  admin: {
    useAsTitle: 'content',
    defaultColumns: ['user', 'direction', 'messageType', 'status', 'timestamp'],
    description: 'WhatsApp message history and conversation tracking',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: false, // Some messages might not have linked users yet
      label: 'User',
      admin: {
        description: 'User associated with this message',
      },
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: false,
      label: 'Related Order',
      admin: {
        description: 'Order associated with this message conversation',
      },
    },
    {
      name: 'messageId',
      type: 'text',
      required: true,
      unique: true,
      label: 'Message ID',
      admin: {
        description: 'Unique message identifier from Gupshup',
      },
    },
    {
      name: 'conversationId',
      type: 'text',
      label: 'Conversation ID',
      admin: {
        description: 'Gupshup conversation identifier',
      },
    },
    {
      name: 'whatsappNumber',
      type: 'text',
      required: true,
      label: 'WhatsApp Number',
      admin: {
        description: 'WhatsApp number that sent/received this message',
      },
    },
    {
      name: 'direction',
      type: 'select',
      required: true,
      options: [
        { label: 'Inbound', value: 'inbound' },
        { label: 'Outbound', value: 'outbound' },
      ],
      admin: {
        description: 'Message direction relative to our system',
      },
    },
    {
      name: 'messageType',
      type: 'select',
      required: true,
      options: [
        { label: 'Text', value: 'text' },
        { label: 'Template', value: 'template' },
        { label: 'Media', value: 'media' },
        { label: 'Interactive', value: 'interactive' },
      ],
      admin: {
        description: 'Type of WhatsApp message',
      },
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      label: 'Message Content',
      admin: {
        description: 'The actual message content',
      },
    },
    {
      name: 'templateName',
      type: 'text',
      label: 'Template Name',
      admin: {
        description: 'Name of the template used (for template messages)',
        condition: (data) => data.messageType === 'template',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'sent',
      options: [
        { label: 'Sent', value: 'sent' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Read', value: 'read' },
        { label: 'Failed', value: 'failed' },
        { label: 'Received', value: 'received' },
      ],
      admin: {
        description: 'Delivery status of the message',
      },
    },
    {
      name: 'timestamp',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
      label: 'Timestamp',
      admin: {
        description: 'When the message was sent/received',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      label: 'Metadata',
      admin: {
        description: 'Additional message metadata from Gupshup',
      },
    },
    {
      name: 'errorMessage',
      type: 'text',
      label: 'Error Message',
      admin: {
        description: 'Error details if message failed',
        condition: (data) => data.status === 'failed',
      },
    },
  ],
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: ({ req: { user } }) => {
      // Only admins can delete messages
      return user?.role === 'admin'
    },
  },
}
