'use client'

import React, { useState } from 'react'

import {
  Menu,
  Activity,
  Plus,
  QrCode,
  Clock,
  Camera,
  Car,
  CreditCard,
  CheckCircle,
  Home,
  BarChart3,
  Settings,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  onClick?: () => void
  disabled?: boolean
}

interface MobileNavigationProps {
  currentStep?: string
  workflowSteps?: NavigationItem[]
  quickActions?: NavigationItem[]
  dashboardSections?: NavigationItem[]
  className?: string
  onNavigate?: (stepId: string) => void
}

export function MobileNavigation({
  currentStep = 'overview',
  workflowSteps = [],
  quickActions = [],
  dashboardSections = [],
  className,
  onNavigate,
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Default workflow steps if none provided
  const defaultWorkflowSteps: NavigationItem[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'new-order', label: 'New Order', icon: Plus },
    { id: 'order-created', label: 'Order Created', icon: QrCode },
    { id: 'initiated-orders', label: 'Initiated', icon: Clock },
    { id: 'vehicle-capture', label: 'Vehicle', icon: Camera },
    { id: 'service-selection', label: 'Services', icon: Car },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'completion', label: 'Complete', icon: CheckCircle },
  ]

  // Default quick actions if none provided
  const defaultQuickActions: NavigationItem[] = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const steps = workflowSteps.length > 0 ? workflowSteps : defaultWorkflowSteps
  const actions = quickActions.length > 0 ? quickActions : defaultQuickActions
  const sections = dashboardSections

  const handleItemClick = (item: NavigationItem) => {
    if (item.disabled) return

    if (item.onClick) {
      item.onClick()
    } else if (onNavigate) {
      onNavigate(item.id)
    }

    setIsOpen(false)
  }

  const renderNavigationItem = (item: NavigationItem, isActive = false) => (
    <button
      key={item.id}
      onClick={() => handleItemClick(item)}
      disabled={item.disabled}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200',
        'touch-target disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
        isActive
          ? 'bg-gradient-to-r from-primary-600/20 to-primary-500/10 border border-primary-500/30 text-primary-300'
          : 'hover:bg-gray-700/30 text-gray-300 hover:text-white',
      )}
    >
      <item.icon
        className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-primary-400' : 'text-gray-400')}
      />

      <span className="text-responsive-sm font-medium min-w-0 flex-1 truncate">{item.label}</span>

      {item.badge && item.badge > 0 && (
        <Badge
          variant="secondary"
          className="bg-primary-500/20 text-primary-300 border-primary-500/30 text-xs"
        >
          {item.badge}
        </Badge>
      )}
    </button>
  )

  return (
    <div className={cn('md:hidden', className)}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700/30"
          >
            <Menu className="w-4 h-4" />
            <span className="sr-only">Open navigation menu</span>
          </Button>
        </SheetTrigger>

        <SheetContent
          side="left"
          className="w-80 bg-gradient-to-b from-gray-900 to-gray-800 border-gray-700"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="text-white text-responsive-lg font-bold">Navigation</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
            {/* Workflow Steps */}
            {steps.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-responsive-sm font-semibold text-gray-400 uppercase tracking-wide">
                  Workflow
                </h3>
                <div className="space-y-1">
                  {steps.map((step) => renderNavigationItem(step, step.id === currentStep))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {actions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-responsive-sm font-semibold text-gray-400 uppercase tracking-wide">
                  Quick Actions
                </h3>
                <div className="space-y-1">
                  {actions.map((action) => renderNavigationItem(action))}
                </div>
              </div>
            )}

            {/* Dashboard Sections */}
            {sections && sections.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-responsive-sm font-semibold text-gray-400 uppercase tracking-wide">
                  Dashboard
                </h3>
                <div className="space-y-1">
                  {sections.map((section) => renderNavigationItem(section))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-responsive-xs text-gray-400 text-center">Mobile Navigation</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
