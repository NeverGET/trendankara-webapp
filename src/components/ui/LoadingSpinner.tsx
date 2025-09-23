// Feature flag based export
// This allows gradual migration from legacy to ReUI components

const useReUI = process.env.NEXT_PUBLIC_USE_REUI === 'true';

// Import both implementations
import { LoadingSpinner as LegacyLoadingSpinner } from '@/components/ui-legacy/LoadingSpinner';
import { LoadingSpinner as ReUILoadingSpinner } from '@/components/ui-adapters/LoadingSpinnerAdapter';

// Export the appropriate version based on feature flag
export const LoadingSpinner = useReUI ? ReUILoadingSpinner : LegacyLoadingSpinner;

// Export default for compatibility
export default LoadingSpinner;