// Feature flag based export
// This allows gradual migration from legacy to ReUI components

const useReUI = process.env.NEXT_PUBLIC_USE_REUI === 'true';

// Import both implementations
import { Input as LegacyInput } from '@/components/ui-legacy/Input';
import { Input as ReUIInput } from '@/components/ui-adapters/InputAdapter';

// Export the appropriate version based on feature flag
export const Input = useReUI ? ReUIInput : LegacyInput;

// Export default for compatibility
export default Input;