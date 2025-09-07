'use client'

import React, { useEffect, useState, useCallback } from 'react'

interface OrderStatusCheckerProps {
  orderId: string
  onOrderInitiated: () => void
  checkInterval?: number // in milliseconds, default 10000 (10 seconds)
  children: (props: { isChecking: boolean; orderStatus: string }) => React.ReactNode
}

export function OrderStatusChecker({ 
  orderId, 
  onOrderInitiated, 
  checkInterval = 10000,
  children 
}: OrderStatusCheckerProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [orderStatus, setOrderStatus] = useState('empty')

  const checkOrderStatus = useCallback(async () => {
    try {
      setIsChecking(true)
      const response = await fetch(`/api/orders/${orderId}/status`)
      if (response.ok) {
        const data = await response.json()
        if (data.orderStage === 'initiated') {
          setOrderStatus('initiated')
          // Auto-navigate to initiated orders after a brief delay
          setTimeout(() => {
            onOrderInitiated()
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Failed to check order status:', error)
    } finally {
      setIsChecking(false)
    }
  }, [orderId, onOrderInitiated])

  useEffect(() => {
    // Check immediately
    checkOrderStatus()

    // Set up polling only if checkInterval is provided and > 0
    if (checkInterval > 0) {
      const interval = setInterval(checkOrderStatus, checkInterval)
      return () => clearInterval(interval)
    }
  }, [checkOrderStatus, checkInterval])

  return <>{children({ isChecking, orderStatus })}</>
}
