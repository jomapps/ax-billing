import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group transform-gpu motion-safe:hover:scale-105 motion-safe:active:scale-95',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-gaming hover:shadow-gaming-lg hover:from-primary-500 hover:to-primary-400',
        destructive:
          'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg hover:shadow-xl hover:from-red-500 hover:to-red-400',
        outline:
          'border-2 border-primary-500 bg-transparent text-primary-400 hover:bg-primary-500/10 hover:text-primary-300 hover:border-primary-400 hover:shadow-lg',
        secondary:
          'bg-gradient-to-r from-secondary-600 to-secondary-500 text-white shadow-lg hover:shadow-xl hover:from-secondary-500 hover:to-secondary-400',
        ghost: 'text-primary-400 hover:bg-primary-500/10 hover:text-primary-300 hover:shadow-sm',
        link: 'text-primary-400 underline-offset-4 hover:underline hover:text-primary-300',
        neon: 'bg-slate-800 border-2 border-blue-400 text-blue-400 hover:bg-blue-400/10 hover:shadow-neon motion-safe:animate-pulse-glow',
        success:
          'bg-gradient-to-r from-accent-600 to-accent-500 text-white shadow-lg hover:shadow-xl hover:from-accent-500 hover:to-accent-400',
        warning:
          'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg hover:shadow-xl hover:from-orange-500 hover:to-orange-400',
        gaming:
          'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl',
        glass:
          'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/30 hover:shadow-lg',
      },
      size: {
        xs: 'h-7 px-2 py-1 text-xs rounded-sm min-w-[2rem] sm:h-8 sm:px-3',
        sm: 'h-8 px-3 py-1.5 text-sm rounded-md min-w-[2.5rem] sm:h-9 sm:px-4',
        default: 'h-9 px-4 py-2 text-sm min-w-[3rem] sm:h-12 sm:px-6 sm:py-3 sm:text-base',
        lg: 'h-10 px-6 py-2.5 text-base min-w-[3.5rem] sm:h-14 sm:px-8 sm:py-4 sm:text-lg',
        xl: 'h-12 px-8 py-3 text-lg min-w-[4rem] sm:h-16 sm:px-10 sm:py-5 sm:text-xl',
        touch: 'h-11 px-6 py-3 text-base min-w-[44px] min-h-[44px] sm:h-12 sm:px-8',
        icon: 'h-9 w-9 min-w-[2.25rem] min-h-[2.25rem] sm:h-12 sm:w-12 sm:min-w-[3rem] sm:min-h-[3rem]',
      },
      glow: {
        none: '',
        subtle: 'motion-safe:hover:animate-pulse-neon',
        strong: 'motion-safe:animate-pulse-neon',
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
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      glow,
      asChild = false,
      children,
      type = 'button',
      disabled,
      loading = false,
      ...props
    },
    ref,
  ) => {
    const [isPressed, setIsPressed] = React.useState(false)
    const Comp = asChild ? Slot : 'button'
    const compProps = asChild ? {} : { type }

    const handlePointerDown = () => setIsPressed(true)
    const handlePointerUp = () => setIsPressed(false)
    const handlePointerLeave = () => setIsPressed(false)

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, glow, className }))}
        ref={ref}
        disabled={disabled}
        aria-busy={loading}
        data-loading={loading}
        data-pressed={isPressed}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        {...compProps}
        {...props}
      >
        {/* Gaming-style inner glow effect */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          aria-hidden="true"
        />
        {/* Enhanced ripple effect for mobile */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-150',
            isPressed && 'opacity-100',
          )}
          aria-hidden="true"
        />
        {/* Loading state overlay */}
        {loading && (
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <span className={cn('relative z-10', loading && 'opacity-0')}>{children}</span>
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
