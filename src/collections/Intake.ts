import type { CollectionConfig } from 'payload'

export const Intake: CollectionConfig = {
  slug: 'intake',
  admin: {
    useAsTitle: 'orderID',
    defaultColumns: [
      'orderID',
      'numberplateImage',
      'vehicleImages',
      'damageAssessment',
      'createdAt',
    ],
    description: 'Vehicle intake documentation with images and damage assessment',
  },
  fields: [
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      unique: true,
      label: 'Order',
      admin: {
        description: 'Order this intake belongs to',
      },
    },
    {
      name: 'orderID',
      type: 'text',
      label: 'Order ID',
      admin: {
        readOnly: true,
        description: 'Auto-populated from related order',
      },
      hooks: {
        beforeValidate: [
          async ({ data, req }) => {
            if (data && data.order && req.payload) {
              try {
                const order = await req.payload.findByID({
                  collection: 'orders',
                  id: data.order,
                })
                return order.orderID
              } catch (error) {
                console.error('Error fetching order:', error)
              }
            }
            return data?.orderID
          },
        ],
      },
    },
    {
      name: 'numberplateImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Numberplate Image',
      admin: {
        description: 'Clear image of vehicle numberplate for AI extraction',
      },
    },
    {
      name: 'vehicleImages',
      type: 'array',
      label: 'Vehicle Images',
      minRows: 1,
      maxRows: 10,
      admin: {
        description: 'Multiple angle images for vehicle type detection and damage assessment',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Vehicle Image',
        },
        {
          name: 'angle',
          type: 'select',
          required: true,
          label: 'Image Angle',
          options: [
            { label: 'Front', value: 'front' },
            { label: 'Rear', value: 'rear' },
            { label: 'Left Side', value: 'left' },
            { label: 'Right Side', value: 'right' },
            { label: 'Front Left', value: 'front_left' },
            { label: 'Front Right', value: 'front_right' },
            { label: 'Rear Left', value: 'rear_left' },
            { label: 'Rear Right', value: 'rear_right' },
            { label: 'Interior', value: 'interior' },
            { label: 'Engine Bay', value: 'engine' },
          ],
        },
        {
          name: 'description',
          type: 'text',
          label: 'Description',
          admin: {
            description: 'Optional description of what this image shows',
          },
        },
      ],
    },
    {
      name: 'damageAssessment',
      type: 'group',
      label: 'Damage Assessment',
      admin: {
        description: 'Initial damage assessment during intake',
      },
      fields: [
        {
          name: 'overallCondition',
          type: 'select',
          required: true,
          label: 'Overall Condition',
          options: [
            { label: 'Excellent', value: 'excellent' },
            { label: 'Good', value: 'good' },
            { label: 'Fair', value: 'fair' },
            { label: 'Poor', value: 'poor' },
          ],
        },
        {
          name: 'existingDamage',
          type: 'array',
          label: 'Existing Damage',
          admin: {
            description: 'Document any existing damage found during intake',
          },
          fields: [
            {
              name: 'type',
              type: 'select',
              required: true,
              label: 'Damage Type',
              options: [
                { label: 'Scratch', value: 'scratch' },
                { label: 'Dent', value: 'dent' },
                { label: 'Crack', value: 'crack' },
                { label: 'Rust', value: 'rust' },
                { label: 'Paint Damage', value: 'paint_damage' },
                { label: 'Broken Part', value: 'broken_part' },
                { label: 'Missing Part', value: 'missing_part' },
                { label: 'Other', value: 'other' },
              ],
            },
            {
              name: 'location',
              type: 'text',
              required: true,
              label: 'Location',
              admin: {
                description: 'Where on the vehicle is this damage located',
              },
            },
            {
              name: 'severity',
              type: 'select',
              required: true,
              label: 'Severity',
              options: [
                { label: 'Minor', value: 'minor' },
                { label: 'Moderate', value: 'moderate' },
                { label: 'Major', value: 'major' },
                { label: 'Severe', value: 'severe' },
              ],
            },
            {
              name: 'description',
              type: 'textarea',
              label: 'Description',
              admin: {
                description: 'Detailed description of the damage',
              },
            },
            {
              name: 'images',
              type: 'relationship',
              relationTo: 'media',
              hasMany: true,
              label: 'Damage Images',
              admin: {
                description: 'Close-up images of this specific damage',
              },
            },
          ],
        },
        {
          name: 'notes',
          type: 'textarea',
          label: 'Additional Notes',
          admin: {
            description: 'Any additional observations or notes about the vehicle condition',
          },
        },
      ],
    },
    {
      name: 'aiProcessingResults',
      type: 'group',
      label: 'AI Processing Results',
      admin: {
        description: 'Results from AI analysis of intake images',
      },
      fields: [
        {
          name: 'numberplateExtracted',
          type: 'text',
          label: 'Extracted Numberplate',
          admin: {
            description: 'Numberplate text extracted by AI',
          },
        },
        {
          name: 'vehicleTypeDetected',
          type: 'text',
          label: 'Detected Vehicle Type',
          admin: {
            description: 'Vehicle type detected by AI',
          },
        },
        {
          name: 'damageDetected',
          type: 'json',
          label: 'AI Damage Detection',
          admin: {
            description: 'Damage detected by AI analysis',
          },
        },
        {
          name: 'processingStatus',
          type: 'select',
          label: 'Processing Status',
          defaultValue: 'pending',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Processing', value: 'processing' },
            { label: 'Completed', value: 'completed' },
            { label: 'Failed', value: 'failed' },
          ],
        },
        {
          name: 'processingErrors',
          type: 'textarea',
          label: 'Processing Errors',
          admin: {
            description: 'Any errors encountered during AI processing',
          },
        },
      ],
    },
    {
      name: 'staffMember',
      type: 'relationship',
      relationTo: 'users',
      label: 'Staff Member',
      admin: {
        description: 'Staff member who performed the intake',
      },
    },
    {
      name: 'intakeCompletedAt',
      type: 'date',
      label: 'Intake Completed At',
      admin: {
        description: 'When the intake process was completed',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        // Set completion timestamp when intake is completed
        if (operation === 'create' || operation === 'update') {
          if (!data.intakeCompletedAt && data.numberplateImage && data.vehicleImages?.length > 0) {
            data.intakeCompletedAt = new Date().toISOString()
          }
        }
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // Trigger AI processing when intake is created/updated
        if (operation === 'create' || operation === 'update') {
          if (doc.numberplateImage && doc.vehicleImages?.length > 0) {
            // TODO: Trigger AI processing workflow
            req.payload.logger.info(`Intake ${doc.id} ready for AI processing`)
          }
        }
      },
    ],
  },
  access: {
    read: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'staff'
    },
    create: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'staff'
    },
    update: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'staff'
    },
    delete: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
  },
}
