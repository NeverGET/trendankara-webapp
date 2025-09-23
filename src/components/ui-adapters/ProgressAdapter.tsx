'use client';

import * as React from 'react';
import { Progress as ReUIProgress } from '@/components/ui/progress-reui';
import { cn } from '@/lib/utils';

interface ProgressAdapterProps extends React.ComponentPropsWithoutRef<typeof ReUIProgress> {
  value?: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4'
};

const variantClasses = {
  default: '',
  success: '[&>*]:bg-green-600',
  warning: '[&>*]:bg-yellow-600',
  danger: '[&>*]:bg-red-600'
};

export const ProgressAdapter = React.forwardRef<
  React.ElementRef<typeof ReUIProgress>,
  ProgressAdapterProps
>(({
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

  return (
    <div className="space-y-1">
      {(showLabel || label) && (
        <div className="flex justify-between text-sm">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showLabel && <span className="text-muted-foreground">{percentage}%</span>}
        </div>
      )}
      <ReUIProgress
        ref={ref}
        value={percentage}
        className={cn(
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      />
    </div>
  );
});

ProgressAdapter.displayName = 'ProgressAdapter';

export default ProgressAdapter;