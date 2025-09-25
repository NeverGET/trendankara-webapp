'use client';

import React from 'react';
import { Separator as ReUISeparator } from '@/components/ui/separator-reui';
import { cn } from '@/lib/utils';

interface SeparatorProps extends React.ComponentPropsWithoutRef<typeof ReUISeparator> {
  label?: string;
}

export const Separator = React.forwardRef<
  React.ElementRef<typeof ReUISeparator>,
  SeparatorProps
>(({ className, orientation = 'horizontal', label, ...props }, ref) => {
  if (label && orientation === 'horizontal') {
    return (
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <ReUISeparator
            ref={ref}
            orientation={orientation}
            className={className}
            {...props}
          />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <ReUISeparator
      ref={ref}
      orientation={orientation}
      className={className}
      {...props}
    />
  );
});

Separator.displayName = "Separator";

export default Separator;