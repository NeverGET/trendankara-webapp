// Feature flag based export
// This allows gradual migration from legacy to ReUI components

const useReUI = true; // process.env.NEXT_PUBLIC_USE_REUI === 'true';

// Import both implementations
import * as ReUI from '@/components/ui-adapters/ResponsiveTableAdapter';
import * as Legacy from '@/components/ui-legacy/ResponsiveTable';

// Export the appropriate version based on feature flag
export const ResponsiveTable = useReUI ? ReUI.ResponsiveTable : Legacy.ResponsiveTable;
export const ResponsiveTableHeader = useReUI ? ReUI.ResponsiveTableHeader : Legacy.ResponsiveTableHeader;
export const ResponsiveTableBody = useReUI ? ReUI.ResponsiveTableBody : Legacy.ResponsiveTableBody;
export const ResponsiveTableRow = useReUI ? ReUI.ResponsiveTableRow : Legacy.ResponsiveTableRow;
export const ResponsiveTableCell = useReUI ? ReUI.ResponsiveTableCell : Legacy.ResponsiveTableCell;