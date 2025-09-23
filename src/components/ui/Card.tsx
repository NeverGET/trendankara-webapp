// Feature flag based export
// This allows gradual migration from legacy to ReUI components

const useReUI = true; // process.env.NEXT_PUBLIC_USE_REUI === 'true';

// Import both implementations
import { Card as ReUICard } from '@/components/ui-adapters/CardAdapter';
import { Card as LegacyCard } from '@/components/ui-legacy/Card';

// Export the appropriate version based on feature flag
export const Card = useReUI ? ReUICard : LegacyCard;

// Export default for compatibility
export default Card;