import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // Ensure controlled inputs don't flip from undefined -> defined
    const hasValueProp = Object.prototype.hasOwnProperty.call(props, 'value');
    const normalizedValue = hasValueProp && type !== 'file' ? ((props as any).value ?? '') : undefined;
    const passProps = {
      ...props,
      ...(hasValueProp && type !== 'file' ? { value: normalizedValue } : {}),
    } as React.InputHTMLAttributes<HTMLInputElement>;
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...passProps}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
