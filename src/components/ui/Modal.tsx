// Feature flag based export
// This allows gradual migration from legacy to ReUI components

const useReUI = true; // process.env.NEXT_PUBLIC_USE_REUI === 'true';

// Import both implementations
import { Modal as ReUIModal } from '@/components/ui-adapters/ModalAdapter';
import { Modal as LegacyModal } from '@/components/ui-legacy/Modal';

// Export the appropriate version based on feature flag
export const Modal = useReUI ? ReUIModal : LegacyModal;

// Export default for compatibility
export default Modal;