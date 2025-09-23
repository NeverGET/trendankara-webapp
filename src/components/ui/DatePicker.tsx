// Feature flag based export
// This allows gradual migration from legacy to ReUI components

const useReUI = process.env.NEXT_PUBLIC_USE_REUI === 'true';

// Import both implementations
import { DatePicker as LegacyDatePicker } from '@/components/ui-legacy/DatePicker';
import { DatePicker as ReUIDatePicker } from '@/components/ui-adapters/DatePickerAdapter';

// Export the appropriate version based on feature flag
export const DatePicker = useReUI ? ReUIDatePicker : LegacyDatePicker;

// Export default for compatibility
export default DatePicker;