// Feature flag based export
// This allows gradual migration from legacy to ReUI components

// Import the adapter implementation
import { DatePicker as DatePickerAdapter } from '@/components/ui-adapters/DatePickerAdapter';

// Export the DatePicker
export const DatePicker = DatePickerAdapter;

// Export default for compatibility
export default DatePicker;