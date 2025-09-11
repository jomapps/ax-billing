import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

// Collections
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Vehicles } from './collections/Vehicles'
import { VehicleImages } from './collections/VehicleImages'
import { Services } from './collections/Services'
import { ServiceCategories } from './collections/ServiceCategories'
import { ServiceOptions } from './collections/ServiceOptions'
import { Orders } from './collections/Orders'
import { CustomerTiers } from './collections/CustomerTiers'
import { WhatsAppMessages } from './collections/WhatsAppMessages'
import { WhatsAppTemplates } from './collections/WhatsAppTemplates'
import { Intake } from './collections/Intake'
import { Delivery } from './collections/Delivery'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '- AX Billing',
    },
  },
  collections: [
    Users,
    Vehicles,
    VehicleImages,
    Services,
    ServiceCategories,
    ServiceOptions,
    Orders,
    CustomerTiers,
    Media,
    WhatsAppMessages,
    WhatsAppTemplates,
    Intake,
    Delivery,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // Cloudflare R2 Storage
    s3Storage({
      collections: {
        media: {
          prefix: 'media',
        },
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT || '',
        region: process.env.S3_REGION || 'auto',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
})
