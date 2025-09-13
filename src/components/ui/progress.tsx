'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const progressVariants = cva('relative w-full overflow-hidden rounded-full', {
  variants: {
    variant: {
      default: 'bg-slate-700 border border-slate-600',
      gaming: 'bg-slate-800 border border-primary-500/30 shadow-gaming',
      neon: 'bg-slate-900 border border-blue-400/50 shadow-neon',
    },
    size: {
      sm: 'h-2',
      default: 'h-4',
      lg: 'h-6',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

const indicatorVariants = cva('h-full w-full flex-1 transition-all duration-500 ease-out', {
  variants: {
    variant: {
      default: 'bg-gradient-to-r from-primary-600 to-primary-500',
      gaming:
        'bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 shadow-gaming animate-pulse-neon',
      neon: 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-neon',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {}

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value, variant, size, ...props }, ref) => (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(progressVariants({ variant, size }), className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(indicatorVariants({ variant }))}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  ),
)
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
