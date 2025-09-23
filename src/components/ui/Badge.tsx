// Feature flag based export
// This allows gradual migration from legacy to ReUI components

const useReUI = true; // process.env.NEXT_PUBLIC_USE_REUI === 'true';

// Import both implementations
import { Badge as ReUIBadge } from '@/components/ui-adapters/BadgeAdapter';
import { Badge as LegacyBadge } from '@/components/ui-legacy/Badge';

// Export the appropriate version based on feature flag
export const Badge = useReUI ? ReUIBadge : LegacyBadge;

// Export default for compatibility
export default Badge;