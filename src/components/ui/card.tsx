import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  'rounded-xl border backdrop-blur-sm transition-all duration-300 relative overflow-hidden group',
  {
    variants: {
      variant: {
        default: 'bg-slate-800 border-slate-600 hover:border-primary-500 hover:bg-slate-700',
        gaming:
          'bg-gradient-to-br from-slate-800 to-slate-900 border-primary-500 hover:border-primary-400 hover:shadow-gaming',
        neon: 'bg-slate-900 border-blue-400 hover:border-blue-300 hover:shadow-neon',
        glass:
          'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md',
        solid: 'bg-slate-800 border-slate-600 hover:border-primary-500',
      },
      size: {
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
      glow: {
        none: '',
        subtle: 'hover:shadow-lg hover:shadow-primary-500/20',
        strong: 'shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      glow: 'none',
    },
  },
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, glow, children, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size, glow, className }))}
      style={style}
      {...props}
    >
      {/* Gaming-style animated border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
      {children}
    </div>
  ),
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-4', className)}
      style={{ padding: '1.5rem 1.5rem 1rem 1.5rem' }}
      {...props}
    />
  ),
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-responsive-xl font-semibold leading-none tracking-tight text-white',
        className,
      )}
      {...props}
    />
  ),
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-responsive-sm text-gray-400', className)} {...props} />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('relative z-10', className)}
      style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}
      {...props}
    />
  ),
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center pt-4', className)} {...props} />
  ),
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
