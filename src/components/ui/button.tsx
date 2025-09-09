import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-btn-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-gaming hover:shadow-gaming-lg hover:from-primary-500 hover:to-primary-400 active:scale-95',
        destructive:
          'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg hover:shadow-xl hover:from-red-500 hover:to-red-400 active:scale-95',
        outline:
          'border-2 border-primary-500 bg-transparent text-primary-400 hover:bg-primary-500/10 hover:text-primary-300 hover:border-primary-400 active:scale-95',
        secondary:
          'bg-gradient-to-r from-secondary-600 to-secondary-500 text-white shadow-lg hover:shadow-xl hover:from-secondary-500 hover:to-secondary-400 active:scale-95',
        ghost: 'text-primary-400 hover:bg-primary-500/10 hover:text-primary-300 active:scale-95',
        link: 'text-primary-400 underline-offset-4 hover:underline hover:text-primary-300',
        neon: 'bg-slate-800 border-2 border-blue-400 text-blue-400 hover:bg-blue-400/10 hover:shadow-neon active:scale-95',
        success:
          'bg-gradient-to-r from-accent-600 to-accent-500 text-white shadow-lg hover:shadow-xl hover:from-accent-500 hover:to-accent-400 active:scale-95',
        warning:
          'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg hover:shadow-xl hover:from-orange-500 hover:to-orange-400 active:scale-95',
      },
      size: {
        default: 'h-12 px-6 py-3 text-btn-base',
        sm: 'h-9 px-4 py-2 text-btn-xs',
        lg: 'h-14 px-8 py-4 text-btn-lg',
        xl: 'h-16 px-10 py-5 text-btn-xl',
        icon: 'h-12 w-12 text-btn-base',
      },
      glow: {
        none: '',
        subtle: 'hover:animate-pulse-neon',
        strong: 'animate-pulse-neon',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      glow: 'none',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, glow, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, glow, className }))} ref={ref} {...props}>
        {/* Gaming-style inner glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {children}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
