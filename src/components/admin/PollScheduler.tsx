'use client';

import React from 'react';
import { DateTimePicker } from '@/components/ui-adapters/DateTimePickerAdapter';
import { Calendar, Clock } from 'lucide-react';

interface PollSchedulerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  startDateError?: string;
  endDateError?: string;
  disabled?: boolean;
  minDate?: string;
  className?: string;
  isEditMode?: boolean;
}

/**
 * PollScheduler Component
 *
 * Provides date/time selection for poll scheduling with validation
 * Features:
 * - Start and end date/time pickers
 * - Automatic validation for date order (end > start)
 * - Minimum date enforcement (today or custom)
 * - Visual error states and messages
 * - Turkish labels and formatting
 */
export function PollScheduler({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startDateError,
  endDateError,
  disabled = false,
  minDate,
  className = '',
  isEditMode = false
}: PollSchedulerProps) {
  // State for "Start Now" switch
  const [startNow, setStartNow] = React.useState(false);

  // Auto-set start date to now when switch is enabled
  React.useEffect(() => {
    if (startNow && !isEditMode) {
      const now = new Date();
      now.setSeconds(0);
      now.setMilliseconds(0);

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const nowString = `${year}-${month}-${day}T${hours}:${minutes}`;

      onStartDateChange(nowString);
    }
  }, [startNow, isEditMode, onStartDateChange]);

  // Get minimum date for inputs (default to current datetime)
  const getMinDate = React.useMemo(() => {
    if (minDate) return minDate;

    const now = new Date();
    // Round to nearest 5 minutes for better UX
    now.setMinutes(Math.ceil(now.getMinutes() / 5) * 5);
    now.setSeconds(0);
    now.setMilliseconds(0);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }, [minDate]);

  // Format date for display
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Get minimum end date based on start date
  const getMinEndDate = React.useMemo(() => {
    if (!startDate) return getMinDate;

    try {
      const start = new Date(startDate);
      // End date should be at least 1 hour after start date
      start.setHours(start.getHours() + 1);

      const year = start.getFullYear();
      const month = String(start.getMonth() + 1).padStart(2, '0');
      const day = String(start.getDate()).padStart(2, '0');
      const hours = String(start.getHours()).padStart(2, '0');
      const minutes = String(start.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return getMinDate;
    }
  }, [startDate, getMinDate]);

  // Handle start date change with automatic end date adjustment
  const handleStartDateChange = (newStartDate: string) => {
    onStartDateChange(newStartDate);

    // If end date is before new start date, adjust it
    if (endDate && newStartDate) {
      try {
        const start = new Date(newStartDate);
        const end = new Date(endDate);

        if (end <= start) {
          // Set end date to 1 day after start date
          const newEnd = new Date(start);
          newEnd.setDate(newEnd.getDate() + 1);

          const year = newEnd.getFullYear();
          const month = String(newEnd.getMonth() + 1).padStart(2, '0');
          const day = String(newEnd.getDate()).padStart(2, '0');
          const hours = String(newEnd.getHours()).padStart(2, '0');
          const minutes = String(newEnd.getMinutes()).padStart(2, '0');
          const endDateString = `${year}-${month}-${day}T${hours}:${minutes}`;

          onEndDateChange(endDateString);
        }
      } catch (error) {
        console.warn('Date adjustment error:', error);
      }
    }
  };

  // Calculate duration between dates
  const getDuration = React.useMemo(() => {
    if (!startDate || !endDate) return null;

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffMs = end.getTime() - start.getTime();

      if (diffMs <= 0) return null;

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        return `${days} gün ${hours} saat`;
      } else if (hours > 0) {
        return `${hours} saat ${minutes} dakika`;
      } else {
        return `${minutes} dakika`;
      }
    } catch {
      return null;
    }
  }, [startDate, endDate]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">
          Anket Tarihleri
        </h3>
      </div>

      {/* "Start Now" Switch - Only show in create mode */}
      {!isEditMode && (
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={startNow}
              onChange={(e) => setStartNow(e.target.checked)}
              disabled={disabled}
              className="w-5 h-5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">
                Şimdi Başlat
              </div>
              <div className="text-xs text-muted-foreground">
                Anketi şu anda başlat (başlangıç tarihi otomatik ayarlanır)
              </div>
            </div>
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            <Clock className="inline-block h-4 w-4 mr-2" />
            Başlangıç Tarihi ve Saati *
          </label>
          <DateTimePicker
            value={startDate || ''}
            onChange={handleStartDateChange}
            min={getMinDate}
            disabled={disabled || startNow}
            error={startDateError}
            placeholder="Başlangıç tarihini seçin"
          />
          {startDateError && (
            <div className="text-sm text-brand-red-600" id="start-date-error" role="alert">
              {startDateError}
            </div>
          )}
          {startDate && !startDateError && (
            <div className="text-xs text-muted-foreground">
              {formatDateForDisplay(startDate)}
            </div>
          )}
        </div>

        {/* End Date Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            <Clock className="inline-block h-4 w-4 mr-2" />
            Bitiş Tarihi ve Saati *
          </label>
          <DateTimePicker
            value={endDate || ''}
            onChange={onEndDateChange}
            min={getMinEndDate}
            disabled={disabled || !startDate}
            error={endDateError}
            placeholder="Bitiş tarihini seçin"
          />
          {endDateError && (
            <div className="text-sm text-brand-red-600" id="end-date-error" role="alert">
              {endDateError}
            </div>
          )}
          {endDate && !endDateError && (
            <div className="text-xs text-muted-foreground">
              {formatDateForDisplay(endDate)}
            </div>
          )}
          {!startDate && (
            <div className="text-xs text-muted-foreground/70">
              Önce başlangıç tarihini seçin
            </div>
          )}
        </div>
      </div>

      {/* Duration Display */}
      {getDuration && (
        <div className="bg-muted border border-border rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Anket Süresi:
            </span>
            <span className="text-sm text-muted-foreground">
              {getDuration}
            </span>
          </div>
        </div>
      )}

      {/* Quick Duration Presets */}
      {!disabled && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">
            Hızlı Seçim:
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '1 Gün', hours: 24 },
              { label: '3 Gün', hours: 72 },
              { label: '1 Hafta', hours: 168 },
              { label: '2 Hafta', hours: 336 },
              { label: '1 Ay', hours: 720 }
            ].map(({ label, hours }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (!startDate) return;

                  try {
                    const start = new Date(startDate);
                    const end = new Date(start);
                    end.setHours(end.getHours() + hours);

                    const year = end.getFullYear();
                    const month = String(end.getMonth() + 1).padStart(2, '0');
                    const day = String(end.getDate()).padStart(2, '0');
                    const endHours = String(end.getHours()).padStart(2, '0');
                    const minutes = String(end.getMinutes()).padStart(2, '0');
                    const endDateString = `${year}-${month}-${day}T${endHours}:${minutes}`;

                    onEndDateChange(endDateString);
                  } catch (error) {
                    console.warn('Quick select error:', error);
                  }
                }}
                disabled={!startDate}
                className="px-3 py-1 text-xs border border-border rounded-md
                         text-muted-foreground hover:text-foreground
                         hover:border-foreground/50 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {label}
              </button>
            ))}
          </div>
          {!startDate && (
            <div className="text-xs text-muted-foreground/70">
              Hızlı seçim için önce başlangıç tarihi seçin
            </div>
          )}
        </div>
      )}

      {/* Validation Hints */}
      <div className="text-xs text-muted-foreground/70 space-y-1">
        <div>• Anket en az 1 saat sürmeli</div>
        <div>• Başlangıç tarihi geçmişte olamaz</div>
        <div>• Bitiş tarihi başlangıç tarihinden sonra olmalı</div>
      </div>
    </div>
  );
}

export default PollScheduler;