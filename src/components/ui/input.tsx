import * as React from "react"
import type { LucideIcon } from 'lucide-react'; // Import LucideIcon type
import { cn } from "@/lib/utils"

// Extend the props to include an optional Icon component
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  Icon?: LucideIcon;
}


const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, Icon, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
         {Icon && (
          <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background py-2 px-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            Icon ? "pl-9" : "pl-3", // Add padding-left if Icon exists
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
