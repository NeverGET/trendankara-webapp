import React, { forwardRef, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, required, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = ref || internalRef;

    // Auto-grow functionality
    const adjustHeight = () => {
      const textarea = (textareaRef as React.RefObject<HTMLTextAreaElement>)?.current;
      if (textarea) {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        // Set height to scrollHeight, constrained by min and max
        const newHeight = Math.min(Math.max(textarea.scrollHeight, 60), 200);
        textarea.style.height = `${newHeight}px`;
      }
    };

    // Adjust height on mount and when value changes
    useEffect(() => {
      adjustHeight();
    }, [props.value]);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-medium text-dark-text-primary mb-1"
          >
            {label}
            {required && <span className="text-brand-red-600 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={textareaRef}
          id={textareaId}
          className={cn(
            'w-full px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg',
            'bg-dark-surface-secondary border border-dark-border-primary',
            // Use 16px on mobile to prevent zoom, 16px on desktop (Requirements 8.1, 8.2, 8.3)
            'text-base text-dark-text-primary placeholder-dark-text-tertiary',
            'focus:outline-none focus:ring-2 focus:ring-brand-red-600 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200',
            'min-h-[60px] max-h-[200px]', // Auto-grow constraints
            'resize-y overflow-hidden', // Allow manual resize with resize-y
            error && 'border-red-600 focus:ring-red-600',
            className
          )}
          onInput={adjustHeight}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="text-xs text-red-600 mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';