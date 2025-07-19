import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const medievalButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-medium font-cinzel ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-medieval hover:shadow-gold-glow",
  {
    variants: {
      variant: {
        default: "bg-gradient-gold text-primary-foreground hover:bg-gradient-gold/90 border-2 border-primary/20",
        parchment: "bg-gradient-parchment text-card border-2 border-muted hover:bg-secondary/90",
        stone: "bg-gradient-stone text-foreground border-2 border-border hover:bg-muted/50",
        ghost: "text-foreground hover:bg-muted/20 border-2 border-transparent hover:border-border",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2 border-destructive/20",
        success: "bg-success text-success-foreground hover:bg-success/90 border-2 border-success/20"
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-sm",
        lg: "h-14 px-8 py-4 text-lg",
        xl: "h-16 px-10 py-5 text-xl",
        icon: "h-12 w-12"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface MedievalButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof medievalButtonVariants> {
  asChild?: boolean
}

const MedievalButton = React.forwardRef<HTMLButtonElement, MedievalButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(medievalButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
MedievalButton.displayName = "MedievalButton"

export { MedievalButton, medievalButtonVariants }