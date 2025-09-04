import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-xl border backdrop-blur-sm transition-all duration-300 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default:
          "bg-dark-800/80 border-dark-600 hover:border-primary-500/50 hover:bg-dark-800/90",
        gaming:
          "bg-gradient-to-br from-dark-800/90 to-dark-900/90 border-primary-500/30 hover:border-primary-400/60 hover:shadow-gaming",
        neon:
          "bg-dark-900/90 border-neon-blue/30 hover:border-neon-blue/60 hover:shadow-neon",
        glass:
          "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md",
        solid:
          "bg-dark-800 border-dark-600 hover:border-primary-500/50",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
      glow: {
        none: "",
        subtle: "hover:shadow-lg hover:shadow-primary-500/20",
        strong: "shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: "none",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, glow, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size, glow, className }))}
      {...props}
    >
      {/* Gaming-style animated border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
      {children}
    </div>
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-white",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-400", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("relative z-10", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
