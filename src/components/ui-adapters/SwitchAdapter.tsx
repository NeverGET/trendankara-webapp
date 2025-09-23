'use client';

import React from 'react';
import { Switch as ReUISwitch } from '@/components/ui/switch-reui';
import { cn } from '@/lib/utils';

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof ReUISwitch> {
  label?: string;
  description?: string;
  error?: string;
}

export const Switch = React.forwardRef<
  React.ElementRef<typeof ReUISwitch>,
  SwitchProps
>(({ className, label, description, error, id, ...props }, ref) => {
  const switchId = id || label?.toLowerCase().replace(/\s+/g, '-');

  if (label) {
    return (
      <div className="flex items-start space-x-3">
        <ReUISwitch
          ref={ref}
          id={switchId}
          className={cn(
            error && "border-destructive",
            className
          )}
          {...props}
        />
        <div className="space-y-1 leading-none">
          <label
            htmlFor={switchId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              error && "text-destructive"
            )}
          >
            {label}
          </label>
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <ReUISwitch
      ref={ref}
      id={switchId}
      className={cn(
        error && "border-destructive",
        className
      )}
      {...props}
    />
  );
});

Switch.displayName = "Switch";

export default Switch;