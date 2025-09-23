// Feature flag based export
// This allows gradual migration from legacy to ReUI components

const useReUI = process.env.NEXT_PUBLIC_USE_REUI === 'true';

// Import both implementations
import { Badge as LegacyBadge } from '@/components/ui-legacy/Badge';
import { Badge as ReUIBadge } from '@/components/ui-adapters/BadgeAdapter';

// Export the appropriate version based on feature flag
export const Badge = useReUI ? ReUIBadge : LegacyBadge;

// Export default for compatibility
export default Badge;