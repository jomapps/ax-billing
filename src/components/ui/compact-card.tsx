import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { CARD_VARIANT_MAPS } from '@/components/ui/card'

const compactCardVariants = cva(
  "rounded-lg border backdrop-blur-sm transition-all duration-300 relative overflow-hidden group motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.99] transform-gpu before:content-[''] before:absolute before:inset-0 before:bg-black/20 before:pointer-events-none",
  {
    variants: {
      variant: CARD_VARIANT_MAPS.variant,
      size: {
        xs: 'p-2',
        sm: 'p-3',
        default: 'p-3 sm:p-4',
        lg: 'p-4 sm:p-5',
        mobile: 'p-2 sm:p-3 max-w-full',
        touch: 'p-3 sm:p-4 min-h-[44px]',
      },
      glow: CARD_VARIANT_MAPS.glow,
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      glow: 'none',
    },
  },
)

export interface CompactCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof compactCardVariants> {}

const CompactCard = React.forwardRef<HTMLDivElement, CompactCardProps>(
  ({ className, variant, size, glow, children, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(compactCardVariants({ variant, size, glow, className }))}
      style={style}
      {...props}
    >
      {/* Gaming-style animated border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 motion-safe:animate-pulse" />
      {children}
    </div>
  ),
)
CompactCard.displayName = 'CompactCard'

const CompactCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1 p-2 sm:p-3', className)} {...props} />
  ),
)
CompactCardHeader.displayName = 'CompactCardHeader'

const CompactCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-sm font-semibold leading-none tracking-tight text-white sm:text-base',
      className,
    )}
    {...props}
  />
))
CompactCardTitle.displayName = 'CompactCardTitle'

const CompactCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-xs text-gray-400 sm:text-sm', className)} {...props} />
))
CompactCardDescription.displayName = 'CompactCardDescription'

const CompactCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('relative z-10 p-2 sm:p-3 pt-0', className)} {...props} />
  ),
)
CompactCardContent.displayName = 'CompactCardContent'

const CompactCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-2 sm:p-3 pt-0', className)} {...props} />
  ),
)
CompactCardFooter.displayName = 'CompactCardFooter'

export {
  CompactCard,
  CompactCardHeader,
  CompactCardFooter,
  CompactCardTitle,
  CompactCardDescription,
  CompactCardContent,
}
