'use client';

import React from 'react';
import { Slider as ReUISlider } from '@/components/ui/slider-reui';
import { cn } from '@/lib/utils';

interface SliderProps extends React.ComponentPropsWithoutRef<typeof ReUISlider> {
  label?: string;
  showValue?: boolean;
  error?: string;
}

export const Slider = React.forwardRef<
  React.ElementRef<typeof ReUISlider>,
  SliderProps
>(({ className, label, showValue, error, value, ...props }, ref) => {
  const currentValue = value?.[0] || props.defaultValue?.[0] || 0;

  if (label || showValue) {
    return (
      <div className="w-full space-y-2">
        {label && (
          <div className="flex items-center justify-between">
            <label className={cn(
              "text-sm font-medium",
              error ? "text-destructive" : "text-foreground"
            )}>
              {label}
            </label>
            {showValue && (
              <span className="text-sm text-muted-foreground">
                {currentValue}
              </span>
            )}
          </div>
        )}
        <ReUISlider
          ref={ref}
          value={value}
          className={cn(
            error && "[&_[role=slider]]:border-destructive",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }

  return (
    <ReUISlider
      ref={ref}
      value={value}
      className={cn(
        error && "[&_[role=slider]]:border-destructive",
        className
      )}
      {...props}
    />
  );
});

Slider.displayName = "Slider";

export default Slider;