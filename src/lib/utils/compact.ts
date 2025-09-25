/**
 * Compact Sizing Utility Functions
 * Centralized utilities for component compact sizing classes
 * Requirements: 1.1, 1.2, 2.1, 2.2
 */

import { cn } from '@/lib/utils';
import {
  COMPACT_BUTTON_SIZES,
  COMPACT_INPUT_SIZES,
  COMPACT_SPACING,
  type ResponsiveValue,
  type Breakpoint
} from '@/types/responsive';
import { isMobile, getCurrentBreakpoint } from '@/lib/utils/responsive';

// Button size type based on compact button configurations
export type CompactButtonSize = keyof typeof COMPACT_BUTTON_SIZES;

// Input size type based on compact input configurations
export type CompactInputSize = keyof typeof COMPACT_INPUT_SIZES;

// Spacing size type based on compact spacing configurations
export type CompactSpacingSize = keyof typeof COMPACT_SPACING;

/**
 * Get compact button classes with responsive sizing
 * Returns Tailwind classes for button height, padding, and text size
 * Requirement 1.1, 1.2: Mobile/desktop size differentiation
 * Requirement 2.1: Touch-friendly button sizes
 */
export function getCompactButtonClasses(
  size: CompactButtonSize = 'md',
  variant: 'primary' | 'secondary' | 'ghost' = 'primary'
): string {
  const sizeConfig = COMPACT_BUTTON_SIZES[size];

  // Convert pixel heights to Tailwind height classes
  const heightMap: Record<number, string> = {
    28: 'h-7',    // 28px
    32: 'h-8',    // 32px
    36: 'h-9',    // 36px
    40: 'h-10',   // 40px
    44: 'h-11',   // 44px
  };

  // Responsive padding based on size
  const paddingMap: Record<CompactButtonSize, string> = {
    xs: 'px-2 md:px-2',
    sm: 'px-3 md:px-2.5',
    md: 'px-4 md:px-3',
    lg: 'px-5 md:px-4',
  };

  // Text size based on button size
  const textSizeMap: Record<CompactButtonSize, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm md:text-sm',
    lg: 'text-base md:text-sm',
  };

  const mobileHeight = heightMap[sizeConfig.mobile] || 'h-10';
  const desktopHeight = heightMap[sizeConfig.desktop] || 'h-9';

  return cn(
    // Base button styles
    'inline-flex items-center justify-center rounded-md font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',

    // Responsive heights
    mobileHeight,
    `md:${desktopHeight}`,

    // Responsive padding and text size
    paddingMap[size],
    textSizeMap[size],

    // Variant-specific styles
    variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
    variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground'
  );
}

/**
 * Get compact input classes with responsive sizing
 * Returns Tailwind classes for input height, padding, and text size
 * Requirement 1.1, 1.2: Mobile/desktop size differentiation
 * Requirement 2.1: Touch-friendly input sizes
 */
export function getCompactInputClasses(
  size: CompactInputSize = 'md',
  variant: 'default' | 'error' | 'success' = 'default'
): string {
  const sizeConfig = COMPACT_INPUT_SIZES[size];

  // Convert pixel heights to Tailwind height classes
  const heightMap: Record<number, string> = {
    32: 'h-8',    // 32px
    36: 'h-9',    // 36px
    40: 'h-10',   // 40px
    44: 'h-11',   // 44px
    48: 'h-12',   // 48px
  };

  // Responsive padding based on size
  const paddingMap: Record<CompactInputSize, string> = {
    xs: 'px-2 md:px-2',
    sm: 'px-3 md:px-2.5',
    md: 'px-3 md:px-3',
    lg: 'px-4 md:px-3.5',
  };

  // Text size based on input size
  const textSizeMap: Record<CompactInputSize, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
  };

  const mobileHeight = heightMap[sizeConfig.mobile] || 'h-11';
  const desktopHeight = heightMap[sizeConfig.desktop] || 'h-10';

  return cn(
    // Base input styles
    'flex w-full rounded-md border border-input bg-background',
    'text-foreground placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',

    // Responsive heights
    mobileHeight,
    `md:${desktopHeight}`,

    // Responsive padding and text size
    paddingMap[size],
    textSizeMap[size],

    // Variant-specific styles
    variant === 'error' && 'border-destructive focus-visible:ring-destructive',
    variant === 'success' && 'border-green-500 focus-visible:ring-green-500'
  );
}

/**
 * Get compact spacing classes for layout density
 * Returns Tailwind spacing classes (gap, margin, padding) based on responsive sizing
 * Requirement 1.1, 1.2: Mobile/desktop spacing differentiation
 * Requirement 2.2: Proper spacing between interactive elements
 */
export function getCompactSpacing(
  size: CompactSpacingSize = 'md',
  type: 'gap' | 'margin' | 'padding' | 'space-y' | 'space-x' = 'gap'
): string {
  const sizeConfig = COMPACT_SPACING[size];

  // Convert pixel values to Tailwind spacing classes
  const spacingMap: Record<number, string> = {
    4: '1',      // 4px = space-1
    6: '1.5',    // 6px = space-1.5
    8: '2',      // 8px = space-2
    12: '3',     // 12px = space-3
    16: '4',     // 16px = space-4
    20: '5',     // 20px = space-5
  };

  const mobileSpacing = spacingMap[sizeConfig.mobile] || '2';
  const desktopSpacing = spacingMap[sizeConfig.desktop] || '3';

  // Generate responsive spacing classes based on type
  switch (type) {
    case 'gap':
      return cn(`gap-${mobileSpacing}`, `md:gap-${desktopSpacing}`);
    case 'margin':
      return cn(`m-${mobileSpacing}`, `md:m-${desktopSpacing}`);
    case 'padding':
      return cn(`p-${mobileSpacing}`, `md:p-${desktopSpacing}`);
    case 'space-y':
      return cn(`space-y-${mobileSpacing}`, `md:space-y-${desktopSpacing}`);
    case 'space-x':
      return cn(`space-x-${mobileSpacing}`, `md:space-x-${desktopSpacing}`);
    default:
      return cn(`gap-${mobileSpacing}`, `md:gap-${desktopSpacing}`);
  }
}

/**
 * Helper function to get current compact sizing based on viewport
 * Returns appropriate size for current breakpoint
 * Requirement 1.1, 1.2: Dynamic size selection based on screen size
 */
export function getCurrentCompactSize<T extends CompactButtonSize | CompactInputSize>(
  sizes: Record<Breakpoint, T>,
  fallback: T = 'md' as T
): T {
  const currentBreakpoint = getCurrentBreakpoint();
  return sizes[currentBreakpoint] || fallback;
}

/**
 * Helper function to determine if compact sizing should be applied
 * Returns true for mobile and small tablet viewports
 * Requirement 2.1: Touch-optimized sizing on appropriate devices
 */
export function shouldUseCompactSizing(): boolean {
  return isMobile() || getCurrentBreakpoint() === 'sm';
}

/**
 * Get compact classes for a flex container with proper spacing
 * Combines gap and padding for consistent component spacing
 * Requirement 1.1, 1.2: Consistent spacing patterns
 */
export function getCompactContainerClasses(
  size: CompactSpacingSize = 'md',
  direction: 'row' | 'col' = 'row'
): string {
  const gapClasses = getCompactSpacing(size, 'gap');
  const paddingClasses = getCompactSpacing(size, 'padding');

  return cn(
    'flex',
    direction === 'col' ? 'flex-col' : 'flex-row',
    gapClasses,
    paddingClasses
  );
}

/**
 * Get compact classes for a grid container with responsive columns
 * Combines grid layout with proper spacing
 * Requirement 1.1, 1.2: Responsive grid layouts with compact spacing
 */
export function getCompactGridClasses(
  cols: { mobile: number; desktop: number } = { mobile: 1, desktop: 2 },
  size: CompactSpacingSize = 'md'
): string {
  const gapClasses = getCompactSpacing(size, 'gap');

  return cn(
    'grid',
    `grid-cols-${cols.mobile}`,
    `md:grid-cols-${cols.desktop}`,
    gapClasses
  );
}