// Feature flag based export
// This allows gradual migration from legacy to ReUI components

const useReUI = true; // process.env.NEXT_PUBLIC_USE_REUI === 'true';

// Import both implementations
import { ConfirmDialog as ReUIConfirmDialog } from '@/components/ui-adapters/ConfirmDialogAdapter';
import { ConfirmDialog as LegacyConfirmDialog } from '@/components/ui-legacy/ConfirmDialog';

// Export the appropriate version based on feature flag
export const ConfirmDialog = useReUI ? ReUIConfirmDialog : LegacyConfirmDialog;

// Export default for compatibility
export default ConfirmDialog;