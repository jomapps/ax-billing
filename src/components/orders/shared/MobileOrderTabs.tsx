'use client'

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProgressiveDisclosure } from '@/components/ui/progressive-disclosure'
import { cn } from '@/lib/utils'
import {
  Eye,
  Settings,
  Package,
  Truck,
  User,
  Clock,
  DollarSign,
  Camera,
  CheckCircle,
} from 'lucide-react'

interface TabConfig {
  value: string
  label: string
  icon: React.ReactNode
  mobileLabel?: string
}

interface MobileOrderTabsProps {
  defaultTab?: string
  tabConfigs?: TabConfig[]
  children: React.ReactNode
  className?: string
  onTabChange?: (value: string) => void
  enableSwipeGestures?: boolean
}

const defaultTabConfigs: TabConfig[] = [
  {
    value: 'overview',
    label: 'Overview',
    icon: <Eye className="w-4 h-4" />,
    mobileLabel: 'Info',
  },
  {
    value: 'actions',
    label: 'Actions',
    icon: <Settings className="w-4 h-4" />,
    mobileLabel: 'Actions',
  },
  {
    value: 'services',
    label: 'Services',
    icon: <Package className="w-4 h-4" />,
    mobileLabel: 'Services',
  },
  {
    value: 'process',
    label: 'Process',
    icon: <Truck className="w-4 h-4" />,
    mobileLabel: 'Process',
  },
]

export function MobileOrderTabs({
  defaultTab = 'overview',
  tabConfigs = defaultTabConfigs,
  children,
  className,
  onTabChange,
  enableSwipeGestures = true,
}: MobileOrderTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    onTabChange?.(value)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipeGestures) return
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!enableSwipeGestures) return
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!enableSwipeGestures || !touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = tabConfigs.findIndex((tab) => tab.value === activeTab)

      if (isLeftSwipe && currentIndex < tabConfigs.length - 1) {
        // Swipe left - next tab
        handleTabChange(tabConfigs[currentIndex + 1].value)
      } else if (isRightSwipe && currentIndex > 0) {
        // Swipe right - previous tab
        handleTabChange(tabConfigs[currentIndex - 1].value)
      }
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Mobile-Optimized Tab List */}
        <TabsList
          className="grid w-full bg-gray-800/50 border-gray-700 h-auto p-1"
          style={{ gridTemplateColumns: `repeat(${tabConfigs.length}, 1fr)` }}
        >
          {tabConfigs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'flex flex-col items-center gap-1 py-2 px-1 text-xs sm:text-sm',
                'data-[state=active]:bg-gray-700 data-[state=active]:text-white',
                'transition-all duration-200 touch-target min-h-[3rem]',
              )}
            >
              <div className="flex items-center justify-center">{tab.icon}</div>
              <span className="hidden xs:inline">{tab.mobileLabel || tab.label}</span>
              <span className="xs:hidden text-[10px]">
                {tab.mobileLabel?.slice(0, 3) || tab.label.slice(0, 3)}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Content with Swipe Support */}
        <div
          className="mt-4"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {children}
        </div>

        {/* Swipe Indicator (Mobile Only) */}
        {enableSwipeGestures && (
          <div className="flex justify-center mt-4 sm:hidden">
            <div className="flex items-center gap-1">
              {tabConfigs.map((tab, index) => (
                <div
                  key={tab.value}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-200',
                    activeTab === tab.value ? 'bg-blue-400' : 'bg-gray-600',
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </Tabs>
    </div>
  )
}

// Specialized tab configurations for different order views
export const orderDetailTabConfigs: TabConfig[] = [
  {
    value: 'overview',
    label: 'Overview',
    icon: <Eye className="w-4 h-4" />,
    mobileLabel: 'Info',
  },
  {
    value: 'actions',
    label: 'Actions',
    icon: <Settings className="w-4 h-4" />,
    mobileLabel: 'Actions',
  },
  {
    value: 'services',
    label: 'Services',
    icon: <Package className="w-4 h-4" />,
    mobileLabel: 'Services',
  },
  {
    value: 'process',
    label: 'Process',
    icon: <Truck className="w-4 h-4" />,
    mobileLabel: 'Process',
  },
]

export const orderPageTabConfigs: TabConfig[] = [
  {
    value: 'status',
    label: 'Status',
    icon: <Clock className="w-4 h-4" />,
    mobileLabel: 'Status',
  },
  {
    value: 'qr',
    label: 'QR Code',
    icon: <Eye className="w-4 h-4" />,
    mobileLabel: 'QR',
  },
  {
    value: 'details',
    label: 'Details',
    icon: <User className="w-4 h-4" />,
    mobileLabel: 'Details',
  },
]

export const orderInitiatedTabConfigs: TabConfig[] = [
  {
    value: 'customer',
    label: 'Customer',
    icon: <User className="w-4 h-4" />,
    mobileLabel: 'Customer',
  },
  {
    value: 'vehicle',
    label: 'Vehicle',
    icon: <Camera className="w-4 h-4" />,
    mobileLabel: 'Vehicle',
  },
  {
    value: 'progress',
    label: 'Progress',
    icon: <CheckCircle className="w-4 h-4" />,
    mobileLabel: 'Progress',
  },
]

// Enhanced TabContent wrapper with progressive disclosure
interface EnhancedTabContentProps {
  value: string
  title?: string
  priority?: 'high' | 'medium' | 'low'
  children: React.ReactNode
  className?: string
}

export function EnhancedTabContent({
  value,
  title,
  priority = 'high',
  children,
  className,
}: EnhancedTabContentProps) {
  return (
    <TabsContent value={value} className={cn('space-y-4', className)}>
      {title ? (
        <ProgressiveDisclosure
          trigger={<span className="font-medium">{title}</span>}
          priority={priority}
          className="bg-gray-700/30 rounded-lg p-4"
        >
          {children}
        </ProgressiveDisclosure>
      ) : (
        children
      )}
    </TabsContent>
  )
}
