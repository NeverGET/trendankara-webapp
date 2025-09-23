// Feature flag based export
// This allows gradual migration from legacy to ReUI components

const useReUI = true; // process.env.NEXT_PUBLIC_USE_REUI === 'true';

// Import both implementations
import { ProgressAdapter as ReUIProgress } from '@/components/ui-adapters/ProgressAdapter';
import { Progress as LegacyProgress } from '@/components/ui-legacy/Progress';

// Export the appropriate version based on feature flag
export const Progress = useReUI ? ReUIProgress : LegacyProgress;

// Export default for compatibility
export default Progress;