import React, { forwardRef, useEffect, useRef } from 'react';
import { Textarea as ReUITextarea } from '@/components/ui/textarea-reui';
import { cn } from '@/lib/utils';

interface LegacyTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, LegacyTextareaProps>(
  ({ label, error, required, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref || internalRef) as React.RefObject<HTMLTextAreaElement>;

    // Auto-grow functionality
    const adjustHeight = () => {
      const textarea = textareaRef?.current;
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
        <ReUITextarea
          ref={textareaRef}
          id={textareaId}
          className={cn(
            // Override ReUI defaults
            'min-h-[60px] max-h-[200px]',
            'text-base', // Ensure 16px font size on mobile
            // Dark theme styling
            'bg-dark-surface-secondary border-dark-border-primary',
            'text-dark-text-primary placeholder-dark-text-tertiary',
            'focus:ring-brand-red-600',
            'resize-y overflow-hidden',
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

// Export as default for drop-in replacement
export default Textarea;