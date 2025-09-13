'use client'

import React, { useState, useRef, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressiveDisclosureProps {
  children: React.ReactNode
  trigger: React.ReactNode
  priority?: 'high' | 'medium' | 'low'
  variant?: 'inline' | 'modal' | 'accordion' | 'tabs'
  className?: string
  triggerClassName?: string
  contentClassName?: string
  defaultOpen?: boolean
  disabled?: boolean
  onToggle?: (isOpen: boolean) => void
}

export function ProgressiveDisclosure({
  children,
  trigger,
  priority = 'medium',
  variant = 'inline',
  className,
  triggerClassName,
  contentClassName,
  defaultOpen = false,
  disabled = false,
  onToggle,
}: ProgressiveDisclosureProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)
  const contentId = useId()

  const handleToggle = () => {
    if (disabled) return
    const newState = !isOpen
    setIsOpen(newState)
    onToggle?.(newState)
  }

  const priorityStyles = {
    high: 'border-primary-500/30 bg-primary-500/5',
    medium: 'border-gray-600/50 bg-gray-700/20',
    low: 'border-gray-700/30 bg-gray-800/10',
  }

  const variantStyles = {
    inline: {
      container: 'space-y-2',
      trigger:
        'flex items-center gap-2 text-left w-full p-2 rounded-md transition-all duration-200 hover:bg-gray-700/30',
      content: 'pl-6 pr-2',
    },
    modal: {
      container: 'relative',
      trigger:
        'flex items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200 hover:bg-gray-700/30',
      content:
        'absolute top-full left-0 right-0 z-10 mt-2 p-4 bg-gray-800 border border-gray-600 rounded-lg shadow-lg',
    },
    accordion: {
      container: 'border rounded-lg overflow-hidden',
      trigger:
        'flex items-center justify-between w-full p-3 text-left transition-all duration-200 hover:bg-gray-700/30 border-b border-gray-700',
      content: 'p-3 border-t border-gray-700',
    },
    tabs: {
      container: 'space-y-3',
      trigger:
        'inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
      content: 'p-3 bg-gray-800/50 rounded-lg border border-gray-700',
    },
  }

  const styles = variantStyles[variant]

  const renderTrigger = () => (
    <button
      onClick={handleToggle}
      disabled={disabled}
      className={cn(
        styles.trigger,
        priorityStyles[priority],
        'touch-target disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
        triggerClassName,
      )}
      aria-expanded={isOpen}
      aria-controls={contentId}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">{trigger}</div>

      {variant === 'inline' && (
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex-shrink-0"
        >
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </motion.div>
      )}

      {variant === 'modal' && (
        <div className="flex-shrink-0">
          {isOpen ? (
            <EyeOff className="w-4 h-4 text-gray-400" />
          ) : (
            <Eye className="w-4 h-4 text-gray-400" />
          )}
        </div>
      )}
    </button>
  )

  const renderContent = () => (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          id={contentId}
          ref={contentRef}
          initial={
            variant === 'modal' ? { opacity: 0, scale: 0.95, y: -10 } : { height: 0, opacity: 0 }
          }
          animate={
            variant === 'modal' ? { opacity: 1, scale: 1, y: 0 } : { height: 'auto', opacity: 1 }
          }
          exit={
            variant === 'modal' ? { opacity: 0, scale: 0.95, y: -10 } : { height: 0, opacity: 0 }
          }
          transition={{
            duration: variant === 'modal' ? 0.2 : 0.3,
            ease: 'easeInOut',
          }}
          className={cn(variant !== 'modal' && 'overflow-hidden', styles.content, contentClassName)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className={cn(styles.container, className)}>
      {renderTrigger()}
      {renderContent()}
    </div>
  )
}

// Specialized components for common use cases
export function InlineDisclosure(props: Omit<ProgressiveDisclosureProps, 'variant'>) {
  return <ProgressiveDisclosure {...props} variant="inline" />
}

export function ModalDisclosure(props: Omit<ProgressiveDisclosureProps, 'variant'>) {
  return <ProgressiveDisclosure {...props} variant="modal" />
}

export function AccordionDisclosure(props: Omit<ProgressiveDisclosureProps, 'variant'>) {
  return <ProgressiveDisclosure {...props} variant="accordion" />
}

export function TabsDisclosure(props: Omit<ProgressiveDisclosureProps, 'variant'>) {
  return <ProgressiveDisclosure {...props} variant="tabs" />
}
