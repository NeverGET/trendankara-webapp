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
        'bg-gradient-to-br from-dark-surface-primary to-dark-surface-secondary/50 rounded-xl border border-dark-border-primary/50',
        'transition-all duration-300',
        'hover:shadow-2xl hover:shadow-black/30 hover:border-dark-border-primary',
        'backdrop-blur-sm relative overflow-hidden',
        'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.02] before:to-transparent before:pointer-events-none',
        className
      )}
      {...props}
    >
      {title && (
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-dark-border-primary/50 bg-gradient-to-r from-transparent to-dark-surface-primary/30">
          <h3 className="text-base md:text-lg font-semibold text-dark-text-primary bg-gradient-to-r from-dark-text-primary to-dark-text-secondary bg-clip-text">
            {title}
          </h3>
        </div>
      )}
      <div className="p-4 md:p-6 relative z-10">{children}</div>
      {footer && (
        <div className="px-4 py-3 md:px-6 md:py-4 border-t border-dark-border-primary/50 bg-gradient-to-r from-dark-surface-secondary/30 to-dark-surface-secondary/50 rounded-b-xl backdrop-blur-sm">
          {footer}
        </div>
      )}
    </div>
  );
}