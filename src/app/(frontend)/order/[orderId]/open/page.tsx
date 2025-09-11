import React from 'react'
import { OrderOpenView } from '@/components/orders/stages/OrderOpenView'
import { findOrderByOrderID } from '@/lib/server/order-queries'

interface OrderOpenPageProps {
  params: Promise<{ orderId: string }>
}

export default async function OrderOpenPage({ params }: OrderOpenPageProps) {
  const resolvedParams = await params
  const orderId = resolvedParams.orderId

  // Use server-side PayloadCMS query to get order data
  const rawOrderData = await findOrderByOrderID(orderId)

  // Convert null values to undefined for component compatibility
  const initialOrderData = rawOrderData
    ? {
        ...rawOrderData,
        whatsappLinked: rawOrderData.whatsappLinked ?? undefined,
        whatsappNumber: rawOrderData.whatsappNumber ?? undefined,
        qrCodeGenerated: rawOrderData.qrCodeGenerated ?? undefined,
        servicesRendered:
          rawOrderData.servicesRendered?.map((item) => ({
            ...item,
            id: item.id ?? undefined,
            service:
              typeof item.service === 'string'
                ? {
                    id: item.service,
                    name: 'Unknown Service',
                    description: '',
                    basePrice: item.servicePrice || 0,
                    estimatedTime: 0,
                    category: 'general',
                    icon: 'car',
                  }
                : {
                    id: item.service.id,
                    name: item.service.name,
                    description:
                      typeof item.service.description === 'string' ? item.service.description : '',
                    basePrice: item.service.basePrice,
                    estimatedTime: item.service.estimatedMinutes || 0,
                    category:
                      typeof item.service.category === 'string'
                        ? item.service.category
                        : item.service.category?.name || 'general',
                    icon: item.service.icon || 'car',
                    popular: item.service.isPopular ?? undefined,
                    vehicleTypes: [],
                    compatibleOptions: [],
                  },
            selectedOptions:
              item.selectedOptions?.map((option) =>
                typeof option === 'string'
                  ? {
                      id: option,
                      name: 'Unknown Option',
                      additionalPrice: 0,
                    }
                  : {
                      id: option.id,
                      name: option.name,
                      description: option.description ?? undefined,
                      additionalPrice: option.additionalPrice,
                      icon: option.icon ?? undefined,
                    },
              ) ?? [],
            optionsPrice: item.optionsPrice ?? 0,
          })) ?? undefined,
        qrCodeScannedAt: rawOrderData.qrCodeScannedAt ?? undefined,
        vehicleCapturedAt: rawOrderData.vehicleCapturedAt ?? undefined,
        discountAmount: rawOrderData.discountAmount ?? undefined,
        jobStatus: rawOrderData.jobStatus ?? undefined,
        customer:
          rawOrderData.customer && typeof rawOrderData.customer === 'object'
            ? {
                id: rawOrderData.customer.id,
                name:
                  `${rawOrderData.customer.firstName || ''} ${rawOrderData.customer.lastName || ''}`.trim() ||
                  'Unknown Customer',
                email: rawOrderData.customer.email || undefined,
                phone: rawOrderData.customer.whatsappNumber || undefined,
              }
            : undefined,
        vehicle:
          rawOrderData.vehicle && typeof rawOrderData.vehicle === 'object'
            ? {
                id: rawOrderData.vehicle.id,
                licensePlate: rawOrderData.vehicle.licensePlate || 'Unknown',
                vehicleType: rawOrderData.vehicle.vehicleType || 'Unknown',
                make: rawOrderData.vehicle.make || undefined,
                model: rawOrderData.vehicle.model || undefined,
                year: rawOrderData.vehicle.year || undefined,
                color: rawOrderData.vehicle.color || undefined,
              }
            : undefined,
      }
    : null

  return <OrderOpenView orderId={orderId} initialOrderData={initialOrderData} />
}

export async function generateMetadata({ params }: OrderOpenPageProps) {
  const resolvedParams = await params
  return {
    title: `Order ${resolvedParams.orderId} - Service Management`,
    description: `Service selection and management for order ${resolvedParams.orderId}`,
  }
}
