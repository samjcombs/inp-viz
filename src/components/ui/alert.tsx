import * as React from "react"
import { cn } from "@/lib/utils"

interface AlertProps {
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const Alert = React.forwardRef<
  HTMLDivElement,
  AlertProps
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(
      "relative w-full rounded-lg border p-4",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
Alert.displayName = "Alert"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={className}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription } 