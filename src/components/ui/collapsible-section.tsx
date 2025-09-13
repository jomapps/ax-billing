'use client'

import React, { useState, useRef, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  icon?: React.ComponentType<{ className?: string }>
  className?: string
  headerClassName?: string
  contentClassName?: string
  variant?: 'default' | 'compact' | 'gaming'
  disabled?: boolean
  onToggle?: (isOpen: boolean) => void
  id?: string
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  icon: Icon,
  className,
  headerClassName,
  contentClassName,
  variant = 'default',
  disabled = false,
  onToggle,
  id,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)
  const uniqueId = useId()
  const contentId = id || uniqueId

  const handleToggle = () => {
    if (disabled) return
    const newState = !isOpen
    setIsOpen(newState)
    onToggle?.(newState)
  }

  const variantStyles = {
    default: {
      container: 'bg-gray-800/50 border-gray-700 rounded-lg',
      header: 'p-3 sm:p-4 border-b border-gray-700',
      content: 'p-3 sm:p-4',
    },
    compact: {
      container: 'bg-gray-800/30 border-gray-700/50 rounded-md',
      header: 'p-2 sm:p-3 border-b border-gray-700/50',
      content: 'p-2 sm:p-3',
    },
    gaming: {
      container:
        'bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-primary-500/30 rounded-lg shadow-gaming',
      header:
        'p-3 sm:p-4 border-b border-primary-500/30 bg-gradient-to-r from-primary-500/5 to-transparent',
      content: 'p-3 sm:p-4',
    },
  }

  const styles = variantStyles[variant]

  return (
    <div className={cn('border transition-all duration-300', styles.container, className)}>
      {/* Header */}
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between text-left transition-all duration-200',
          'hover:bg-gray-700/30 focus:outline-none focus:ring-2 focus:ring-primary-500/50',
          'touch-target disabled:opacity-50 disabled:cursor-not-allowed',
          styles.header,
          headerClassName,
        )}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400 flex-shrink-0" />}
          <h3 className="text-responsive-sm sm:text-responsive-base font-semibold text-white truncate">
            {title}
          </h3>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex-shrink-0 ml-2"
        >
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={contentId}
            ref={contentRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.3, ease: 'easeInOut' },
              opacity: { duration: 0.2, ease: 'easeInOut' },
            }}
            className="overflow-hidden"
          >
            <div className={cn(styles.content, contentClassName)}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
