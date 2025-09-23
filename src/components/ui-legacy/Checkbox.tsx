'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

    if (label) {
      return (
        <div className="flex items-start space-x-2">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              "mt-0.5 h-4 w-4 rounded border-gray-300",
              "text-primary focus:ring-primary focus:ring-2 focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
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
      <input
        ref={ref}
        type="checkbox"
        id={checkboxId}
        className={cn(
          "h-4 w-4 rounded border-gray-300",
          "text-primary focus:ring-primary focus:ring-2 focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-600",
          className
        )}
        {...props}
      />
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;