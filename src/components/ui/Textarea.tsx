// Feature flag based export
// This allows gradual migration from legacy to ReUI components

const useReUI = true; // process.env.NEXT_PUBLIC_USE_REUI === 'true';

// Import both implementations
import { Textarea as ReUITextarea } from '@/components/ui-adapters/TextareaAdapter';
import { Textarea as LegacyTextarea } from '@/components/ui-legacy/Textarea';

// Export the appropriate version based on feature flag
export const Textarea = useReUI ? ReUITextarea : LegacyTextarea;

// Export default for compatibility
export default Textarea;