// Feature flag based export
// This allows gradual migration from legacy to ReUI components

const useReUI = true; // process.env.NEXT_PUBLIC_USE_REUI === 'true';

// Import both implementations
import { DatePicker as ReUIDatePicker } from '@/components/ui-adapters/DatePickerAdapter';
import { DatePicker as LegacyDatePicker } from '@/components/ui-legacy/DatePicker';

// Export the appropriate version based on feature flag
export const DatePicker = useReUI ? ReUIDatePicker : LegacyDatePicker;

// Export default for compatibility
export default DatePicker;