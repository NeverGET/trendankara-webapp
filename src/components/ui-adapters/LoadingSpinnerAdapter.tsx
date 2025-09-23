import React from 'react';
import { cn } from '@/lib/utils';

interface LegacyLoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large' | 'responsive';
  text?: string;
  className?: string;
  hideText?: boolean;
}

const sizeClasses = {
  small: 'h-4 w-4',
  medium: 'h-8 w-8',
  large: 'h-12 w-12',
  responsive: 'h-6 w-6 md:h-8 md:w-8'
};

const textSizeClasses = {
  small: 'text-xs',
  medium: 'text-sm',
  large: 'text-base',
  responsive: 'text-xs md:text-sm'
};

export function LoadingSpinner({
  size = 'medium',
  text = 'Yükleniyor...',
  className,
  hideText = false
}: LegacyLoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 md:gap-3', className)}>
      <div className="relative">
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
      </div>
      {text && !hideText && (
        <p className={cn(
          'text-dark-text-secondary animate-pulse',
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );
}

// Export as default for drop-in replacement
export default LoadingSpinner;