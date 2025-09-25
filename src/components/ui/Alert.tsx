// Feature flag based export
// This allows gradual migration from legacy to ReUI components

const useReUI = true; // process.env.NEXT_PUBLIC_USE_REUI === 'true';

// Import ReUI implementation
import { Alert as ReUIAlert } from '@/components/ui-adapters/AlertAdapter';

// Export the ReUI version
export const Alert = ReUIAlert;

// Export default for compatibility
export default Alert;