import type { CollectionConfig } from 'payload'

export const Delivery: CollectionConfig = {
  slug: 'delivery',
  admin: {
    useAsTitle: 'orderID',
    defaultColumns: [
      'orderID',
      'deliveryImages',
      'vehicleInspection',
      'newDamageDetected',
      'createdAt',
    ],
    description: 'Vehicle delivery documentation with inspection and damage comparison',
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
        description: 'Order this delivery belongs to',
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
            if (data.order && req.payload) {
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
            return data.orderID
          },
        ],
      },
    },
    {
      name: 'intake',
      type: 'relationship',
      relationTo: 'intake',
      label: 'Related Intake',
      admin: {
        description: 'Intake record for damage comparison',
      },
    },
    {
      name: 'deliveryImages',
      type: 'array',
      label: 'Delivery Images',
      minRows: 1,
      maxRows: 15,
      admin: {
        description: 'Images taken during delivery for damage comparison',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Delivery Image',
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
            { label: 'Damage Detail', value: 'damage_detail' },
          ],
        },
        {
          name: 'description',
          type: 'text',
          label: 'Description',
          admin: {
            description: 'Description of what this image shows',
          },
        },
      ],
    },
    {
      name: 'vehicleInspection',
      type: 'group',
      label: 'Vehicle Inspection',
      admin: {
        description: 'Detailed vehicle inspection during delivery',
      },
      fields: [
        {
          name: 'batteryStatus',
          type: 'select',
          required: true,
          label: 'Battery Status',
          options: [
            { label: 'Excellent', value: 'excellent' },
            { label: 'Good', value: 'good' },
            { label: 'Fair', value: 'fair' },
            { label: 'Poor', value: 'poor' },
            { label: 'Needs Replacement', value: 'needs_replacement' },
          ],
        },
        {
          name: 'tyreCondition',
          type: 'group',
          label: 'Tyre Condition',
          fields: [
            {
              name: 'frontLeft',
              type: 'select',
              label: 'Front Left',
              options: [
                { label: 'Excellent', value: 'excellent' },
                { label: 'Good', value: 'good' },
                { label: 'Fair', value: 'fair' },
                { label: 'Poor', value: 'poor' },
                { label: 'Needs Replacement', value: 'needs_replacement' },
              ],
            },
            {
              name: 'frontRight',
              type: 'select',
              label: 'Front Right',
              options: [
                { label: 'Excellent', value: 'excellent' },
                { label: 'Good', value: 'good' },
                { label: 'Fair', value: 'fair' },
                { label: 'Poor', value: 'poor' },
                { label: 'Needs Replacement', value: 'needs_replacement' },
              ],
            },
            {
              name: 'rearLeft',
              type: 'select',
              label: 'Rear Left',
              options: [
                { label: 'Excellent', value: 'excellent' },
                { label: 'Good', value: 'good' },
                { label: 'Fair', value: 'fair' },
                { label: 'Poor', value: 'poor' },
                { label: 'Needs Replacement', value: 'needs_replacement' },
              ],
            },
            {
              name: 'rearRight',
              type: 'select',
              label: 'Rear Right',
              options: [
                { label: 'Excellent', value: 'excellent' },
                { label: 'Good', value: 'good' },
                { label: 'Fair', value: 'fair' },
                { label: 'Poor', value: 'poor' },
                { label: 'Needs Replacement', value: 'needs_replacement' },
              ],
            },
          ],
        },
        {
          name: 'tyrePressure',
          type: 'group',
          label: 'Tyre Pressure',
          fields: [
            {
              name: 'frontLeft',
              type: 'number',
              label: 'Front Left (PSI)',
              min: 0,
              max: 100,
            },
            {
              name: 'frontRight',
              type: 'number',
              label: 'Front Right (PSI)',
              min: 0,
              max: 100,
            },
            {
              name: 'rearLeft',
              type: 'number',
              label: 'Rear Left (PSI)',
              min: 0,
              max: 100,
            },
            {
              name: 'rearRight',
              type: 'number',
              label: 'Rear Right (PSI)',
              min: 0,
              max: 100,
            },
          ],
        },
        {
          name: 'engineStatus',
          type: 'select',
          required: true,
          label: 'Engine Status',
          options: [
            { label: 'Excellent', value: 'excellent' },
            { label: 'Good', value: 'good' },
            { label: 'Fair', value: 'fair' },
            { label: 'Poor', value: 'poor' },
            { label: 'Needs Service', value: 'needs_service' },
            { label: 'Not Checked', value: 'not_checked' },
          ],
        },
        {
          name: 'rimCondition',
          type: 'group',
          label: 'Rim Condition',
          fields: [
            {
              name: 'frontLeft',
              type: 'select',
              label: 'Front Left',
              options: [
                { label: 'Excellent', value: 'excellent' },
                { label: 'Good', value: 'good' },
                { label: 'Fair', value: 'fair' },
                { label: 'Poor', value: 'poor' },
                { label: 'Damaged', value: 'damaged' },
              ],
            },
            {
              name: 'frontRight',
              type: 'select',
              label: 'Front Right',
              options: [
                { label: 'Excellent', value: 'excellent' },
                { label: 'Good', value: 'good' },
                { label: 'Fair', value: 'fair' },
                { label: 'Poor', value: 'poor' },
                { label: 'Damaged', value: 'damaged' },
              ],
            },
            {
              name: 'rearLeft',
              type: 'select',
              label: 'Rear Left',
              options: [
                { label: 'Excellent', value: 'excellent' },
                { label: 'Good', value: 'good' },
                { label: 'Fair', value: 'fair' },
                { label: 'Poor', value: 'poor' },
                { label: 'Damaged', value: 'damaged' },
              ],
            },
            {
              name: 'rearRight',
              type: 'select',
              label: 'Rear Right',
              options: [
                { label: 'Excellent', value: 'excellent' },
                { label: 'Good', value: 'good' },
                { label: 'Fair', value: 'fair' },
                { label: 'Poor', value: 'poor' },
                { label: 'Damaged', value: 'damaged' },
              ],
            },
          ],
        },
        {
          name: 'recommendations',
          type: 'array',
          label: 'Recommendations',
          admin: {
            description: 'Any recommendations for the customer',
          },
          fields: [
            {
              name: 'category',
              type: 'select',
              required: true,
              label: 'Category',
              options: [
                { label: 'Battery', value: 'battery' },
                { label: 'Tyres', value: 'tyres' },
                { label: 'Engine', value: 'engine' },
                { label: 'Rims', value: 'rims' },
                { label: 'Brakes', value: 'brakes' },
                { label: 'Fluids', value: 'fluids' },
                { label: 'Electrical', value: 'electrical' },
                { label: 'Body Work', value: 'body_work' },
                { label: 'Other', value: 'other' },
              ],
            },
            {
              name: 'priority',
              type: 'select',
              required: true,
              label: 'Priority',
              options: [
                { label: 'Low', value: 'low' },
                { label: 'Medium', value: 'medium' },
                { label: 'High', value: 'high' },
                { label: 'Urgent', value: 'urgent' },
              ],
            },
            {
              name: 'description',
              type: 'textarea',
              required: true,
              label: 'Description',
              admin: {
                description: 'Detailed recommendation description',
              },
            },
            {
              name: 'estimatedCost',
              type: 'number',
              label: 'Estimated Cost',
              min: 0,
              admin: {
                step: 0.01,
                description: 'Estimated cost for this recommendation',
              },
            },
          ],
        },
        {
          name: 'overallNotes',
          type: 'textarea',
          label: 'Overall Notes',
          admin: {
            description: 'General notes about the vehicle condition and delivery',
          },
        },
      ],
    },
    {
      name: 'damageComparison',
      type: 'group',
      label: 'Damage Comparison',
      admin: {
        description: 'Comparison between intake and delivery images for new damage detection',
      },
      fields: [
        {
          name: 'newDamageDetected',
          type: 'checkbox',
          label: 'New Damage Detected',
          defaultValue: false,
          admin: {
            description: 'Whether new damage was found during delivery inspection',
          },
        },
        {
          name: 'newDamage',
          type: 'array',
          label: 'New Damage Found',
          admin: {
            description: 'Document any new damage found during delivery',
            condition: (data) => data.newDamageDetected,
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
                description: 'Where on the vehicle is this new damage located',
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
                description: 'Detailed description of the new damage',
              },
            },
            {
              name: 'images',
              type: 'relationship',
              relationTo: 'media',
              hasMany: true,
              label: 'Damage Images',
              admin: {
                description: 'Close-up images of this specific new damage',
              },
            },
            {
              name: 'likelyDuringService',
              type: 'checkbox',
              label: 'Likely Occurred During Service',
              defaultValue: false,
              admin: {
                description: 'Whether this damage likely occurred during the service',
              },
            },
          ],
        },
        {
          name: 'aiComparisonResults',
          type: 'group',
          label: 'AI Comparison Results',
          admin: {
            description: 'Results from AI-powered damage comparison',
          },
          fields: [
            {
              name: 'comparisonStatus',
              type: 'select',
              label: 'Comparison Status',
              defaultValue: 'pending',
              options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Processing', value: 'processing' },
                { label: 'Completed', value: 'completed' },
                { label: 'Failed', value: 'failed' },
              ],
            },
            {
              name: 'aiDetectedDamage',
              type: 'json',
              label: 'AI Detected Damage',
              admin: {
                description: 'New damage detected by AI comparison',
              },
            },
            {
              name: 'confidenceScore',
              type: 'number',
              label: 'Confidence Score',
              min: 0,
              max: 1,
              admin: {
                step: 0.01,
                description: 'AI confidence score for damage detection (0-1)',
              },
            },
            {
              name: 'comparisonErrors',
              type: 'textarea',
              label: 'Comparison Errors',
              admin: {
                description: 'Any errors encountered during AI comparison',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'staffMember',
      type: 'relationship',
      relationTo: 'users',
      label: 'Staff Member',
      admin: {
        description: 'Staff member who performed the delivery inspection',
      },
    },
    {
      name: 'deliveryCompletedAt',
      type: 'date',
      label: 'Delivery Completed At',
      admin: {
        description: 'When the delivery inspection was completed',
      },
    },
    {
      name: 'customerNotified',
      type: 'checkbox',
      label: 'Customer Notified',
      defaultValue: false,
      admin: {
        description: 'Whether customer has been notified of any new damage',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        // Set completion timestamp when delivery is completed
        if (operation === 'create' || operation === 'update') {
          if (
            !data.deliveryCompletedAt &&
            data.deliveryImages?.length > 0 &&
            data.vehicleInspection
          ) {
            data.deliveryCompletedAt = new Date().toISOString()
          }
        }
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // Trigger AI comparison when delivery is created/updated
        if (operation === 'create' || operation === 'update') {
          if (doc.deliveryImages?.length > 0 && doc.intake) {
            // TODO: Trigger AI damage comparison workflow
            req.payload.logger.info(`Delivery ${doc.id} ready for AI damage comparison`)
          }

          // Send alert if new damage detected
          if (doc.damageComparison?.newDamageDetected && !doc.customerNotified) {
            // TODO: Send damage alert notification
            req.payload.logger.info(`New damage detected in delivery ${doc.id} - alert required`)
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
