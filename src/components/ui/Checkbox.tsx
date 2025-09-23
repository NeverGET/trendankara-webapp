// Feature flag based export
// This allows gradual migration from legacy to ReUI components

const useReUI = process.env.NEXT_PUBLIC_USE_REUI === 'true';

// Import both implementations
import { Checkbox as LegacyCheckbox } from '@/components/ui-legacy/Checkbox';
import { Checkbox as ReUICheckbox } from '@/components/ui-adapters/CheckboxAdapter';

// Export the appropriate version based on feature flag
export const Checkbox = useReUI ? ReUICheckbox : LegacyCheckbox;

// Export default for compatibility
export default Checkbox;