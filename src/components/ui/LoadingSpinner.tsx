import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  className?: string;
}

const sizeClasses = {
  small: 'h-4 w-4',
  medium: 'h-8 w-8',
  large: 'h-12 w-12'
};

export function LoadingSpinner({
  size = 'medium',
  text = 'Yükleniyor...',
  className
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-dark-border-secondary',
          'border-t-brand-red-600',
          sizeClasses[size]
        )}
        role="status"
        aria-label={text}
      >
        <span className="sr-only">{text}</span>
      </div>
      {text && (
        <p className="text-dark-text-secondary text-sm animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}