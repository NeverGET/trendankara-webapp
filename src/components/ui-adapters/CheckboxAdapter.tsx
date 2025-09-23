'use client';

import * as React from "react";
import { Checkbox as ReUICheckbox } from "@/components/ui/checkbox-reui";
import { cn } from "@/lib/utils";

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof ReUICheckbox> {
  label?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof ReUICheckbox>,
  CheckboxProps
>(({ className, label, error, id, ...props }, ref) => {
  const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

  if (label) {
    return (
      <div className="flex items-start space-x-2">
        <ReUICheckbox
          ref={ref}
          id={checkboxId}
          className={cn(
            "mt-0.5",
            error && "border-red-600",
            className
          )}
          {...props}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor={checkboxId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              error && "text-red-600"
            )}
          >
            {label}
          </label>
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <ReUICheckbox
      ref={ref}
      id={checkboxId}
      className={cn(
        error && "border-red-600",
        className
      )}
      {...props}
    />
  );
});

Checkbox.displayName = "Checkbox";

export default Checkbox;