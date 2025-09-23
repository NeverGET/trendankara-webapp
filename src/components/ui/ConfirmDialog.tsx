// Feature flag based export
// This allows gradual migration from legacy to ReUI components

const useReUI = process.env.NEXT_PUBLIC_USE_REUI === 'true';

// Import both implementations
import { ConfirmDialog as LegacyConfirmDialog } from '@/components/ui-legacy/ConfirmDialog';
import { ConfirmDialog as ReUIConfirmDialog } from '@/components/ui-adapters/ConfirmDialogAdapter';

// Export the appropriate version based on feature flag
export const ConfirmDialog = useReUI ? ReUIConfirmDialog : LegacyConfirmDialog;

// Export default for compatibility
export default ConfirmDialog;