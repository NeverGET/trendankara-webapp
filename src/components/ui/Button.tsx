// Feature flag based export
// This allows gradual migration from legacy to ReUI components

const useReUI = true; // process.env.NEXT_PUBLIC_USE_REUI === 'true';

// Import both implementations
import { Button as ReUIButton } from '@/components/ui-adapters/ButtonAdapter';
import { Button as LegacyButton } from '@/components/ui-legacy/Button';

// Export the appropriate version based on feature flag
export const Button = useReUI ? ReUIButton : LegacyButton;

// Export default for compatibility
export default Button;