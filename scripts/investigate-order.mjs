import { getPayload } from 'payload';
import config from '../dist/payload.config.js';

async function investigateOrder() {
  try {
    const payload = await getPayload({ config });
    
    console.log('🔍 Investigating Order AX-20250908-5336...\n');
    
    // Find the specific order
    const orderResult = await payload.find({
      collection: 'orders',
      where: {
        orderID: {
          equals: 'AX-20250908-5336'
        }
      },
      depth: 3,
      limit: 1
    });
    
    if (orderResult.docs.length > 0) {
      const order = orderResult.docs[0];
      console.log('=== ORDER FOUND ===');
      console.log('Order ID:', order.orderID);
      console.log('Order Stage:', order.orderStage);
      console.log('Customer:', order.customer?.name || 'N/A');
      console.log('Customer Phone:', order.customer?.phone || 'N/A');
      console.log('Vehicle:', order.vehicle ? {
        id: order.vehicle.id,
        licensePlate: order.vehicle.licensePlate,
        vehicleType: order.vehicle.vehicleType,
        imageId: order.vehicle.image?.id || 'No image',
        imageUrl: order.vehicle.image?.url || 'No URL',
        aiConfidence: order.vehicle.aiClassificationConfidence || 'N/A'
      } : 'No vehicle linked');
      
      // Check for any media related to this order
      const mediaResult = await payload.find({
        collection: 'media',
        where: {
          alt: {
            contains: order.orderID
          }
        },
        limit: 10
      });
      
      console.log('\n=== RELATED MEDIA ===');
      if (mediaResult.docs.length > 0) {
        mediaResult.docs.forEach(media => {
          console.log('Media ID:', media.id);
          console.log('Alt Text:', media.alt);
          console.log('URL:', media.url);
          console.log('Filename:', media.filename);
          console.log('Category:', media.category);
          console.log('Created:', media.createdAt);
          console.log('---');
        });
      } else {
        console.log('No media found for this order');
      }
      
      // Check for any media with "vehicle" in the alt text around the same time
      const vehicleMediaResult = await payload.find({
        collection: 'media',
        where: {
          alt: {
            contains: 'vehicle'
          }
        },
        sort: '-createdAt',
        limit: 5
      });
      
      console.log('\n=== RECENT VEHICLE MEDIA ===');
      if (vehicleMediaResult.docs.length > 0) {
        vehicleMediaResult.docs.forEach(media => {
          console.log('Media ID:', media.id);
          console.log('Alt Text:', media.alt);
          console.log('URL:', media.url);
          console.log('Filename:', media.filename);
          console.log('Created:', media.createdAt);
          console.log('---');
        });
      } else {
        console.log('No recent vehicle media found');
      }
      
    } else {
      console.log('❌ Order not found');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

investigateOrder();
