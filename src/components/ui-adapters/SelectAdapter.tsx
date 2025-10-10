'use client';

import * as React from 'react';
import {
  Select as ReUISelect,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-reui';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectAdapterProps {
  value?: string;
  onValueChange?: (value: string) => void;
  onChange?: (value: string) => void; // React Hook Form compatibility
  options?: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export const Select = React.forwardRef<HTMLButtonElement, SelectAdapterProps>(
  ({
    value,
    onValueChange,
    onChange, // Support both onValueChange (our API) and onChange (React Hook Form)
    options = [],
    placeholder = "Select an option",
    label,
    error,
    disabled,
    className,
    required,
    ...rest
  }, ref) => {
    // Use onValueChange if provided, otherwise fall back to onChange
    // This ensures compatibility with both React Hook Form and direct usage
    const handleValueChange = onValueChange || onChange;

    return (
      <div className="space-y-1.5">
        {label && (
          <label className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            error && "text-red-600"
          )}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <ReUISelect
          value={value}
          onValueChange={handleValueChange}
          disabled={disabled}
        >
          <SelectTrigger
            ref={ref}
            className={cn(
              error && "border-red-600 focus:ring-red-600",
              className
            )}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </ReUISelect>
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;