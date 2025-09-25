"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
  error?: string
  id?: string
  minDate?: Date
  maxDate?: Date
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
  label,
  error,
  id,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const datePickerId = id || label?.toLowerCase().replace(/\s+/g, '-')

  const datePicker = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={datePickerId}
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            error && "border-destructive",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
          disabled={(date) => {
            if (disabled) return true
            if (minDate && date < minDate) return true
            if (maxDate && date > maxDate) return true
            return false
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )

  if (label) {
    return (
      <div className="w-full space-y-2">
        <label
          htmlFor={datePickerId}
          className={cn(
            "block text-sm font-medium",
            error ? "text-destructive" : "text-foreground"
          )}
        >
          {label}
        </label>
        {datePicker}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }

  return datePicker
}

export default DatePicker