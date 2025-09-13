import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 motion-safe:hover:scale-105 motion-safe:active:scale-95 transform-gpu',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary-600 text-white hover:bg-primary-500 shadow-sm hover:shadow-md',
        secondary:
          'border-transparent bg-secondary-600 text-white hover:bg-secondary-500 shadow-sm hover:shadow-md',
        destructive:
          'border-transparent bg-red-600 text-white hover:bg-red-500 shadow-sm hover:shadow-md',
        outline: 'border-primary-500 text-primary-400 hover:bg-primary-500/10 hover:shadow-sm',
        success:
          'border-transparent bg-accent-600 text-white hover:bg-accent-500 shadow-sm hover:shadow-md',
        warning:
          'border-transparent bg-orange-600 text-white hover:bg-orange-500 shadow-sm hover:shadow-md',
        neon: 'border-blue-400 bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 shadow-neon motion-safe:animate-pulse-glow',
        glass:
          'border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:shadow-sm',
        gaming:
          'border-primary-500/50 bg-gradient-to-r from-primary-600/80 to-primary-500/80 text-white hover:from-primary-500/80 hover:to-primary-400/80 shadow-gaming',
        business:
          'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-sm hover:shadow-md',
        'business-primary':
          'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 shadow-sm hover:shadow-md',
      },
      size: {
        xs: 'px-1.5 py-0.5 text-xs min-h-[1.25rem] sm:px-2',
        sm: 'px-2 py-0.5 text-xs min-h-[1.5rem] sm:px-2.5',
        default: 'px-2.5 py-0.5 text-xs min-h-[1.75rem] sm:px-3 sm:text-sm',
        lg: 'px-3 py-1 text-sm min-h-[2rem] sm:px-4 sm:text-base',
        touch: 'px-3 py-1.5 text-sm min-h-[44px] min-w-[44px] sm:px-4',
      },
      glow: {
        none: '',
        subtle: 'hover:shadow-lg',
        strong: 'shadow-lg hover:shadow-xl motion-safe:animate-pulse-neon',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      glow: 'none',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, glow, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size, glow }), className)} {...props} />
}

export { Badge, badgeVariants }
