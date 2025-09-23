// Feature flag based export
// This allows gradual migration from legacy to ReUI components

const useReUI = true; // process.env.NEXT_PUBLIC_USE_REUI === 'true';

// Import both implementations
import { Select as ReUISelect } from '@/components/ui-adapters/SelectAdapter';
import { Select as LegacySelect } from '@/components/ui-legacy/Select';

// Export the appropriate version based on feature flag
export const Select = useReUI ? ReUISelect : LegacySelect;

// Export default for compatibility
export default Select;