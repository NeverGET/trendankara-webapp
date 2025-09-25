import React, { forwardRef } from 'react';
import { Input as ReUIInput } from '@/components/ui/input-reui';
import { cn } from '@/lib/utils';

interface LegacyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, LegacyInputProps>(
  ({ label, error, required, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-dark-text-primary mb-1"
          >
            {label}
            {required && <span className="text-brand-red-600 ml-1">*</span>}
          </label>
        )}
        <ReUIInput
          ref={ref}
          id={inputId}
          className={cn(
            // Override ReUI default height with touch-optimized heights
            'min-h-[44px] md:min-h-[40px]',
            'text-base', // Ensure 16px font size on mobile to prevent zoom
            // Dark theme styling
            'bg-dark-surface-secondary border-dark-border-primary',
            'text-dark-text-primary placeholder-dark-text-tertiary',
            'focus:ring-brand-red-600',
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
          <p id={`${inputId}-error`} className="text-xs text-red-600 mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Export as default for drop-in replacement
export default Input;