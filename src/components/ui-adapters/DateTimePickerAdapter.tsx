'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/Input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateTimePickerProps {
  value?: string; // datetime-local string format
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  id?: string;
  min?: string;
  max?: string;
}

export function DateTimePicker({
  value = '',
  onChange,
  placeholder = "Pick a date and time",
  disabled,
  className,
  label,
  error,
  id,
  min,
  max
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const pickerId = id || label?.toLowerCase().replace(/\s+/g, '-');

  // Parse datetime-local string to Date and time
  const parseDateTime = (datetimeString: string) => {
    if (!datetimeString) return { date: undefined, time: '' };

    const date = new Date(datetimeString);
    const time = datetimeString.includes('T') ? datetimeString.split('T')[1] : '';

    return { date: isNaN(date.getTime()) ? undefined : date, time };
  };

  // Format Date and time to datetime-local string
  const formatDateTime = (date: Date | undefined, time: string) => {
    if (!date) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    if (!time) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      time = `${hours}:${minutes}`;
    }

    return `${year}-${month}-${day}T${time}`;
  };

  const { date, time } = parseDateTime(value);

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      const newDateTime = formatDateTime(newDate, time || '12:00');
      onChange?.(newDateTime);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    if (date) {
      const newDateTime = formatDateTime(date, newTime);
      onChange?.(newDateTime);
    }
  };

  const displayValue = date ?
    format(date, "PPP") + (time ? ` at ${time}` : '') :
    null;

  const dateTimePicker = (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={pickerId}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-destructive",
              className
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayValue || <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 space-y-3">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              disabled={(calendarDate) => {
                if (disabled) return true;
                if (min) {
                  const minDate = new Date(min);
                  if (calendarDate < minDate) return true;
                }
                if (max) {
                  const maxDate = new Date(max);
                  if (calendarDate > maxDate) return true;
                }
                return false;
              }}
              initialFocus
            />
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Time</span>
              </div>
              <Input
                type="time"
                value={time}
                onChange={handleTimeChange}
                disabled={disabled || !date}
                className="w-full"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );

  if (label) {
    return (
      <div className="w-full space-y-2">
        <label
          htmlFor={pickerId}
          className={cn(
            "block text-sm font-medium",
            error ? "text-destructive" : "text-foreground"
          )}
        >
          {label}
        </label>
        {dateTimePicker}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }

  return dateTimePicker;
}

export default DateTimePicker;