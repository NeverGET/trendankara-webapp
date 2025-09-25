'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({
    value = 0,
    max = 100,
    showLabel = false,
    label,
    variant = 'default',
    size = 'md',
    className,
    ...props
  }, ref) => {
    const percentage = Math.round((value / max) * 100);

    const sizeClasses = {
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4'
    };

    const variantClasses = {
      default: 'bg-primary',
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      danger: 'bg-red-600'
    };

    return (
      <div className="space-y-1" ref={ref} {...props}>
        {(showLabel || label) && (
          <div className="flex justify-between text-sm">
            {label && <span className="text-muted-foreground">{label}</span>}
            {showLabel && <span className="text-muted-foreground">{percentage}%</span>}
          </div>
        )}
        <div
          className={cn(
            "w-full bg-secondary rounded-full overflow-hidden",
            sizeClasses[size],
            className
          )}
        >
          <div
            className={cn(
              "h-full transition-all duration-300 ease-in-out",
              variantClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export default Progress;