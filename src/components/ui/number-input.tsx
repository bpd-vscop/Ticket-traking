import * as React from "react";
import { cn } from "@/lib/utils";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  onChange?: (value: number) => void;
  value?: number;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, onChange, value, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = parseFloat(e.target.value) || 0;
      onChange?.(numValue);
    };

    return (
      <input
        type="number"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          className
        )}
        value={value || ''}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    );
  }
);
NumberInput.displayName = "NumberInput";

export { NumberInput };