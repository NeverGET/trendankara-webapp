'use client';

import { Button } from '@/components/ui/button-reui';
import { Calendar } from '@/components/ui/calendar-reui';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover-reui';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format, isValid, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DateTimePickerProps {
  value?: string; // ISO datetime string
  onChange?: (datetime: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  minDate?: Date;
  maxDate?: Date;
  label?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Tarih ve saat seçin',
  disabled,
  className,
  error,
  minDate,
  maxDate,
  label
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('00:00');

  // Parse the incoming ISO string value
  useEffect(() => {
    if (value && value.includes('T')) {
      try {
        const date = parseISO(value);
        if (isValid(date)) {
          setSelectedDate(date);
          const time = value.split('T')[1]?.substring(0, 5) || '00:00';
          setSelectedTime(time);
        }
      } catch (e) {
        // Invalid date string
      }
    }
  }, [value]);

  // Generate time slots (every 30 minutes)
  const timeSlots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeString);
    }
  }

  const handleDateSelect = (newDate: Date | undefined) => {
    setSelectedDate(newDate);
    if (newDate && selectedTime) {
      const dateStr = format(newDate, 'yyyy-MM-dd');
      onChange?.(`${dateStr}T${selectedTime}`);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      onChange?.(`${dateStr}T${time}`);
      setOpen(false); // Close popover after selecting time
    }
  };

  const displayValue = () => {
    if (selectedDate && selectedTime) {
      return `${format(selectedDate, 'dd MMM yyyy', { locale: tr })} - ${selectedTime}`;
    }
    return null;
  };

  const content = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            error && 'border-red-500',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue() || <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex max-sm:flex-col">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="p-2 sm:pe-5 w-[254px] rounded-sm"
            locale={tr}
            disabled={(date) => {
              if (disabled) return true;
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
          />
          <div className="relative w-full max-sm:h-48 sm:w-48">
            <div className="absolute inset-0 py-4 max-sm:border-t">
              <ScrollArea className="h-full sm:border-s">
                <div className="space-y-3">
                  <div className="flex h-5 shrink-0 items-center px-5">
                    <p className="text-sm font-medium">
                      {selectedDate ? format(selectedDate, 'dd MMMM', { locale: tr }) : 'Önce tarih seçin'}
                    </p>
                  </div>
                  <div className="grid gap-1.5 px-5 max-sm:grid-cols-2">
                    {timeSlots.map((timeSlot) => (
                      <Button
                        key={timeSlot}
                        variant={selectedTime === timeSlot ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={() => handleTimeSelect(timeSlot)}
                        disabled={!selectedDate}
                      >
                        {timeSlot}
                      </Button>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  if (label) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium block">
          {label}
        </label>
        {content}
      </div>
    );
  }

  return content;
}