import * as React from 'react'
import { cn } from '@/lib/utils'

const CompactCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors',
      className
    )}
    {...props}
  />
))
CompactCard.displayName = 'CompactCard'

const CompactCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1 p-3 sm:p-4', className)}
    {...props}
  />
))
CompactCardHeader.displayName = 'CompactCardHeader'

const CompactCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-responsive-sm font-semibold leading-none tracking-tight text-white',
      className
    )}
    {...props}
  />
))
CompactCardTitle.displayName = 'CompactCardTitle'

const CompactCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-responsive-xs text-muted-foreground text-gray-400', className)}
    {...props}
  />
))
CompactCardDescription.displayName = 'CompactCardDescription'

const CompactCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-3 sm:p-4 pt-0', className)} {...props} />
))
CompactCardContent.displayName = 'CompactCardContent'

const CompactCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-3 sm:p-4 pt-0', className)}
    {...props}
  />
))
CompactCardFooter.displayName = 'CompactCardFooter'

export {
  CompactCard,
  CompactCardHeader,
  CompactCardFooter,
  CompactCardTitle,
  CompactCardDescription,
  CompactCardContent,
}
