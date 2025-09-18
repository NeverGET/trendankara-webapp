import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Card({
  title,
  footer,
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-dark-surface-primary rounded-lg border border-dark-border-primary',
        'transition-all duration-200 hover:bg-dark-surface-secondary',
        'hover:shadow-lg hover:shadow-black/20',
        className
      )}
      {...props}
    >
      {title && (
        <div className="px-6 py-4 border-b border-dark-border-primary">
          <h3 className="text-lg font-semibold text-dark-text-primary">
            {title}
          </h3>
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-dark-border-primary bg-dark-surface-secondary/50 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
}