import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-600 text-white hover:bg-primary-500 shadow-sm",
        secondary:
          "border-transparent bg-secondary-600 text-white hover:bg-secondary-500 shadow-sm",
        destructive:
          "border-transparent bg-red-600 text-white hover:bg-red-500 shadow-sm",
        outline:
          "border-primary-500 text-primary-400 hover:bg-primary-500/10",
        success:
          "border-transparent bg-accent-600 text-white hover:bg-accent-500 shadow-sm",
        warning:
          "border-transparent bg-orange-600 text-white hover:bg-orange-500 shadow-sm",
        neon:
          "border-neon-blue bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 shadow-neon",
        glass:
          "border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20",
        gaming:
          "border-primary-500/50 bg-gradient-to-r from-primary-600/80 to-primary-500/80 text-white hover:from-primary-500/80 hover:to-primary-400/80 shadow-gaming",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
      glow: {
        none: "",
        subtle: "hover:shadow-lg hover:shadow-current/20",
        strong: "shadow-lg shadow-current/30 hover:shadow-xl hover:shadow-current/40 animate-pulse-neon",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: "none",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, glow, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size, glow }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
