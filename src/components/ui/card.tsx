import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import * as Collapsible from '@radix-ui/react-collapsible'
import { cn } from '@/lib/utils'

export const CARD_VARIANT_MAPS = {
  variant: {
    default:
      'bg-slate-800 border-slate-600 hover:border-primary-500 hover:bg-slate-700 hover:shadow-lg',
    gaming:
      'bg-gradient-to-br from-slate-800 to-slate-900 border-primary-500 hover:border-primary-400 hover:shadow-gaming',
    neon: 'bg-slate-900 border-blue-400 hover:border-blue-300 hover:shadow-neon motion-safe:animate-pulse-glow',
    glass:
      'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md hover:shadow-lg',
    solid: 'bg-slate-800 border-slate-600 hover:border-primary-500 hover:shadow-lg',
  },
  size: {
    xs: 'p-2 sm:p-3',
    sm: 'p-3 sm:p-4',
    default: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    mobile: 'p-3 sm:p-4 max-w-full',
    touch: 'p-4 sm:p-6 min-h-[44px]',
  },
  glow: {
    none: '',
    subtle: 'hover:shadow-lg',
    strong: 'shadow-lg hover:shadow-xl',
  },
}

const cardVariants = cva(
  'rounded-xl border backdrop-blur-sm transition-all duration-300 relative overflow-hidden group motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98] transform-gpu',
  {
    variants: {
      variant: CARD_VARIANT_MAPS.variant,
      size: CARD_VARIANT_MAPS.size,
      glow: CARD_VARIANT_MAPS.glow,
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
    VariantProps<typeof cardVariants> {
  collapsible?: boolean
  defaultOpen?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      size,
      glow,
      children,
      style,
      collapsible = false,
      defaultOpen = true,
      ...props
    },
    ref,
  ) => {
    if (collapsible) {
      return (
        <Collapsible.Root defaultOpen={defaultOpen}>
          <div
            ref={ref}
            className={cn(cardVariants({ variant, size, glow, className }))}
            style={style}
            {...props}
          >
            {/* Gaming-style animated border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 motion-safe:animate-pulse" />
            {children}
          </div>
        </Collapsible.Root>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, size, glow, className }))}
        style={style}
        {...props}
      >
        {/* Gaming-style animated border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 motion-safe:animate-pulse" />
        {children}
      </div>
    )
  },
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 px-3 pt-3 pb-2 sm:px-6 sm:pt-6 sm:pb-4', className)}
      {...props}
    />
  ),
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-base font-semibold leading-none tracking-tight text-white sm:text-xl lg:text-2xl',
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
  <p ref={ref} className={cn('text-sm text-gray-400 sm:text-base', className)} {...props} />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('relative z-10 px-3 pb-3 sm:px-6 sm:pb-6', className)}
      {...props}
    />
  ),
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-2 px-3 pb-3 sm:pt-4 sm:px-6 sm:pb-6', className)}
      {...props}
    />
  ),
)
CardFooter.displayName = 'CardFooter'

const CardCollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof Collapsible.Trigger>,
  React.ComponentPropsWithoutRef<typeof Collapsible.Trigger>
>(({ className, ...props }, ref) => (
  <Collapsible.Trigger
    ref={ref}
    className={cn('flex w-full items-center justify-between', className)}
    {...props}
  />
))
CardCollapsibleTrigger.displayName = 'CardCollapsibleTrigger'

const CardCollapsibleContent = React.forwardRef<
  React.ElementRef<typeof Collapsible.Content>,
  React.ComponentPropsWithoutRef<typeof Collapsible.Content>
>(({ className, ...props }, ref) => (
  <Collapsible.Content
    ref={ref}
    className={cn(
      'collapsible-content data-[state=open]:max-h-[500px] data-[state=closed]:max-h-0 overflow-hidden transition-all duration-300 motion-safe:ease-out',
      className,
    )}
    {...props}
  />
))
CardCollapsibleContent.displayName = 'CardCollapsibleContent'

// Convenience wrapper for collapsible cards
const CardCollapsible = React.forwardRef<
  React.ElementRef<typeof Collapsible.Root>,
  React.ComponentPropsWithoutRef<typeof Collapsible.Root> & {
    children: React.ReactNode
  }
>(({ children, ...props }, ref) => (
  <Collapsible.Root ref={ref} {...props}>
    {children}
  </Collapsible.Root>
))
CardCollapsible.displayName = 'CardCollapsible'

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardCollapsible,
  CardCollapsibleTrigger,
  CardCollapsibleContent,
  cardVariants,
}
