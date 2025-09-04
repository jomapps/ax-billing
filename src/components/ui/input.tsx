import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const inputVariants = cva(
  'flex w-full rounded-lg border bg-transparent px-4 py-3 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-slate-600 bg-slate-800/50 text-white focus-visible:border-primary-500 focus-visible:ring-1 focus-visible:ring-primary-500/20 hover:border-slate-500',
        gaming:
          'border-primary-500/30 bg-slate-900/80 text-white focus-visible:border-primary-400 focus-visible:shadow-gaming focus-visible:ring-1 focus-visible:ring-primary-400/30 hover:border-primary-500/50',
        neon: 'border-blue-400/30 bg-slate-900/80 text-blue-400 focus-visible:border-blue-400 focus-visible:shadow-neon focus-visible:ring-1 focus-visible:ring-blue-400/30 hover:border-blue-400/50',
        glass:
          'border-white/10 bg-white/5 text-white backdrop-blur-sm focus-visible:border-white/30 focus-visible:bg-white/10 hover:border-white/20',
      },
      size: {
        sm: 'h-9 px-3 py-2 text-xs',
        default: 'h-12 px-4 py-3 text-sm',
        lg: 'h-14 px-6 py-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input, inputVariants }
