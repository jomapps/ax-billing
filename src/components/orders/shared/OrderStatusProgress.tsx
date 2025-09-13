'use client'

import React from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Package,
  Zap,
} from 'lucide-react'

interface OrderStatusProgressProps {
  orderStage: 'empty' | 'initiated' | 'open' | 'billed' | 'paid'
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded' | 'cash'
  overallStatus?: 'pending' | 'in_progress' | 'completed' | 'ready' | 'picked_up' | 'cancelled'
  variant?: 'linear' | 'circular' | 'stepped'
  showDetails?: boolean
  className?: string
}

const getStageProgress = (stage: string): number => {
  switch (stage) {
    case 'empty':
      return 20
    case 'initiated':
      return 40
    case 'open':
      return 60
    case 'billed':
      return 80
    case 'paid':
      return 100
    default:
      return 0
  }
}

const getStageIcon = (stage: string) => {
  switch (stage) {
    case 'empty':
      return <Clock className="w-4 h-4" />
    case 'initiated':
      return <Zap className="w-4 h-4" />
    case 'open':
      return <Package className="w-4 h-4" />
    case 'billed':
      return <DollarSign className="w-4 h-4" />
    case 'paid':
      return <CheckCircle className="w-4 h-4" />
    default:
      return <AlertTriangle className="w-4 h-4" />
  }
}

const getStageColor = (stage: string): string => {
  switch (stage) {
    case 'empty':
      return 'text-yellow-400'
    case 'initiated':
      return 'text-blue-400'
    case 'open':
      return 'text-purple-400'
    case 'billed':
      return 'text-orange-400'
    case 'paid':
      return 'text-green-400'
    default:
      return 'text-gray-400'
  }
}

const getStageBadgeColor = (stage: string): string => {
  switch (stage) {
    case 'empty':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'initiated':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'open':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    case 'billed':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    case 'paid':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

const getStageLabel = (stage: string): string => {
  switch (stage) {
    case 'empty':
      return 'Waiting for Customer'
    case 'initiated':
      return 'Customer Connected'
    case 'open':
      return 'Service Selection'
    case 'billed':
      return 'Payment Required'
    case 'paid':
      return 'Payment Complete'
    default:
      return 'Unknown Stage'
  }
}

const getStageDescription = (stage: string): string => {
  switch (stage) {
    case 'empty':
      return 'Order created, waiting for customer to scan QR code'
    case 'initiated':
      return 'Customer connected via WhatsApp, capturing vehicle info'
    case 'open':
      return 'Services being selected and configured'
    case 'billed':
      return 'Invoice generated, waiting for payment'
    case 'paid':
      return 'Payment received, ready to begin service'
    default:
      return 'Order status unknown'
  }
}

export function OrderStatusProgress({
  orderStage,
  paymentStatus,
  overallStatus,
  variant = 'linear',
  showDetails = false,
  className,
}: OrderStatusProgressProps) {
  const progress = getStageProgress(orderStage)
  const stageIcon = getStageIcon(orderStage)
  const stageColor = getStageColor(orderStage)
  const stageBadgeColor = getStageBadgeColor(orderStage)
  const stageLabel = getStageLabel(orderStage)
  const stageDescription = getStageDescription(orderStage)

  if (variant === 'stepped') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">Order Progress</h3>
          <span className="text-sm text-gray-400">{progress}%</span>
        </div>
        
        <div className="space-y-3">
          {['empty', 'initiated', 'open', 'billed', 'paid'].map((stage, index) => {
            const isActive = orderStage === stage
            const isCompleted = getStageProgress(orderStage) > getStageProgress(stage)
            const stepIcon = getStageIcon(stage)
            const stepColor = isActive ? getStageColor(stage) : isCompleted ? 'text-green-400' : 'text-gray-400'
            
            return (
              <div key={stage} className="flex items-center gap-3">
                <div className={cn('flex items-center justify-center w-8 h-8 rounded-full border-2', 
                  isActive ? 'border-current bg-current/10' : 
                  isCompleted ? 'border-green-400 bg-green-400/10' : 
                  'border-gray-600 bg-gray-600/10'
                )}>
                  <div className={stepColor}>
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : stepIcon}
                  </div>
                </div>
                <div className="flex-1">
                  <p className={cn('font-medium', isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-gray-400')}>
                    {getStageLabel(stage)}
                  </p>
                  {isActive && showDetails && (
                    <p className="text-gray-400 text-sm">{getStageDescription(stage)}</p>
                  )}
                </div>
                {isActive && (
                  <Badge className={getStageBadgeColor(stage)}>
                    Current
                  </Badge>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={stageColor}>
            {stageIcon}
          </div>
          <span className="text-white font-medium">{stageLabel}</span>
        </div>
        <Badge className={stageBadgeColor}>
          {orderStage.toUpperCase()}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress 
          value={progress} 
          className="h-3" 
          variant="gaming"
        />
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Progress</span>
          <span className="text-gray-300">{progress}%</span>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="space-y-2">
          <p className="text-gray-400 text-sm">{stageDescription}</p>
          
          {paymentStatus && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Payment:</span>
              <Badge className={
                paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' :
                paymentStatus === 'failed' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }>
                {paymentStatus}
              </Badge>
            </div>
          )}
          
          {overallStatus && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Status:</span>
              <Badge className={
                overallStatus === 'completed' ? 'bg-green-500/20 text-green-400' :
                overallStatus === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                'bg-blue-500/20 text-blue-400'
              }>
                {overallStatus.replace('_', ' ')}
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
