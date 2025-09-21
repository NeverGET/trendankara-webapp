import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, required, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-dark-text-primary mb-2"
          >
            {label}
            {required && <span className="text-brand-red-600 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-3 md:px-4 md:py-2 rounded-lg',
            'bg-dark-surface-secondary border border-dark-border-primary',
            // Use 16px on mobile to prevent zoom, 16px on desktop (Requirements 8.1, 8.2, 8.3)
            'text-base text-dark-text-primary placeholder-dark-text-tertiary',
            'focus:outline-none focus:ring-2 focus:ring-brand-red-600 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200',
            'min-h-[44px] md:min-h-[40px]', // Touch-optimized height
            // Special handling for datetime-local inputs
            props.type === 'datetime-local' && '[&::-webkit-datetime-edit]:pr-1',
            error && 'border-red-600 focus:ring-red-600',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';