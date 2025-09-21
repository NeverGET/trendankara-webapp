/**
 * Responsive Design System Type Definitions
 * Mobile-first type system for consistent sizing and spacing
 */

// Breakpoint definitions matching Tailwind's responsive modifiers
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Size tokens for components
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

// Responsive size that can vary by breakpoint
export type ResponsiveSize = Size | {
  base: Size;
  xs?: Size;
  sm?: Size;
  md?: Size;
  lg?: Size;
  xl?: Size;
  '2xl'?: Size;
};

// Generic responsive value type for any property
export type ResponsiveValue<T> = T | {
  base: T;
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
};

// Breakpoint configuration with pixel values
export interface BreakpointConfig {
  name: Breakpoint;
  minWidth: number;     // in pixels
  maxWidth?: number;    // in pixels
  isActive?: boolean;   // runtime state
}

// Size token definition for design system
export interface SizeToken {
  name: string;                              // 'text-sm', 'p-4', etc.
  mobile: string;                            // '14px', '16px'
  tablet?: string;                           // '16px', '20px'
  desktop: string;                           // '16px', '24px'
  category: 'text' | 'spacing' | 'component';
  deprecated?: boolean;
}

// Component size configuration
export interface ComponentSize {
  height: ResponsiveValue<string>;
  padding: ResponsiveValue<string>;
  fontSize: ResponsiveValue<string>;
  minTouchTarget: number;  // in pixels, typically 44
}

// Touch target configuration
export interface TouchTargetConfig {
  standard: number;     // Primary touch target size
  compact: number;      // Compact touch target size
  spacing: number;      // Minimum gap between targets
}

// Typography scale configuration
export interface TypographyScale {
  size: ResponsiveValue<string>;
  lineHeight: ResponsiveValue<number | string>;
  letterSpacing?: ResponsiveValue<string>;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

// Spacing scale configuration
export interface SpacingScale {
  base: number;         // Base unit in pixels (8px)
  scale: number[];      // Multipliers for the base unit
}

// Constants for touch targets and common sizes (Requirements 2.1, 2.2)
export const TOUCH_TARGET_STANDARD = 44;    // 44px standard touch target
export const TOUCH_TARGET_COMPACT = 40;     // 40px compact touch target
export const TOUCH_TARGET_SPACING = 8;      // 8px minimum gap between targets

// Header height constants (Requirement 5.1, 5.2)
export const HEADER_HEIGHT_MOBILE = 56;     // 56px max mobile header
export const HEADER_HEIGHT_DESKTOP = 72;    // 72px max desktop header

// Admin sidebar width (Requirement 5.5)
export const ADMIN_SIDEBAR_WIDTH = 240;     // 240px max sidebar width

// Text size minimums (Requirements 1.1, 1.4)
export const TEXT_SIZE_MIN_MOBILE = 14;     // 14px minimum mobile text
export const TEXT_SIZE_MIN_CRITICAL = 16;   // 16px minimum for critical info

// Spacing base unit (Requirement 4.1)
export const SPACING_BASE_UNIT = 8;         // 8px base spacing unit

// Breakpoint pixel values
export const BREAKPOINTS: Record<Breakpoint, number> = {
  'xs': 475,
  'sm': 640,
  'md': 768,
  'lg': 1024,
  'xl': 1280,
  '2xl': 1536,
};

// Default responsive grid columns
export const GRID_COLUMNS = {
  mobile: 1,      // Single column on mobile
  tablet: 2,      // 2 columns on tablet
  desktop: 3,     // 3-4 columns on desktop
} as const;

// Modal margin on mobile (Requirement 6.5)
export const MODAL_MOBILE_MARGIN = 16;      // 16px margin on mobile screens

// Statistics text sizes (Requirements 7.1, 7.2, 7.3)
export const STAT_SIZES = {
  primary: { mobile: 32, desktop: 48 },     // Primary stat sizes in px
  secondary: { mobile: 24, desktop: 32 },   // Secondary stat sizes in px
  label: 12,                                 // Label size in px
} as const;

// Form input heights (Requirement 8.1, 8.2)
export const INPUT_HEIGHTS = {
  mobile: 44,     // 44px on mobile for touch
  desktop: 40,    // 40-48px on desktop
} as const;

// Type guard to check if value is responsive
export function isResponsiveValue<T>(value: ResponsiveValue<T>): value is Exclude<ResponsiveValue<T>, T> {
  return typeof value === 'object' && value !== null && 'base' in value;
}

// Type guard to check if size is responsive
export function isResponsiveSize(size: ResponsiveSize): size is Exclude<ResponsiveSize, Size> {
  return typeof size === 'object' && size !== null && 'base' in size;
}