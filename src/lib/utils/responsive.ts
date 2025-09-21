/**
 * Responsive Design System Utility Functions
 * Helper functions for responsive sizing and breakpoint detection
 */

import { cn } from '@/lib/utils';
import type {
  Breakpoint,
  Size,
  ResponsiveSize,
  ResponsiveValue,
  BREAKPOINTS,
  TOUCH_TARGET_STANDARD,
  TOUCH_TARGET_COMPACT,
} from '@/types/responsive';

// Import constants from types
const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Get the responsive size class based on breakpoint
 * Requirement 1.3: Smooth transitions between breakpoints
 */
export function getResponsiveSize(base: Size, breakpoint?: Breakpoint): string {
  const sizeMap: Record<Size, string> = {
    'xs': 'text-xs',
    'sm': 'text-sm',
    'md': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  };

  if (!breakpoint) {
    return sizeMap[base];
  }

  return `${breakpoint}:${sizeMap[base]}`;
}

/**
 * Generate responsive classes from a responsive value
 * Requirement 9.1: Support gradual migration with backward compatibility
 */
export function getResponsiveClasses<T extends string>(
  value: ResponsiveValue<T>,
  classPrefix: string
): string {
  // If it's a simple value, return the class directly
  if (typeof value === 'string') {
    return `${classPrefix}-${value}`;
  }

  // If it's a responsive object, generate classes for each breakpoint
  const classes: string[] = [];

  if (value.base) {
    classes.push(`${classPrefix}-${value.base}`);
  }

  const breakpointKeys: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  breakpointKeys.forEach((bp) => {
    if (value[bp]) {
      classes.push(`${bp}:${classPrefix}-${value[bp]}`);
    }
  });

  return cn(...classes);
}

/**
 * Calculate touch target dimensions for an element
 * Requirement 2.4: Ensure clickable area meets minimum requirements
 */
export function calculateTouchTarget(element: HTMLElement | null): {
  width: number;
  height: number;
  needsExpansion: boolean;
} {
  if (!element) {
    return {
      width: 0,
      height: 0,
      needsExpansion: false
    };
  }

  const rect = element.getBoundingClientRect();
  const currentWidth = rect.width;
  const currentHeight = rect.height;

  // Check if element needs expansion to meet touch target requirements
  const minSize = 44; // TOUCH_TARGET_STANDARD
  const needsExpansion = currentWidth < minSize || currentHeight < minSize;

  return {
    width: Math.max(currentWidth, minSize),
    height: Math.max(currentHeight, minSize),
    needsExpansion,
  };
}

/**
 * Detect current breakpoint based on window width
 * Returns the active breakpoint name
 */
export function getCurrentBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') {
    return 'sm'; // Default for SSR
  }

  const width = window.innerWidth;

  if (width < breakpoints.xs) return 'xs';
  if (width < breakpoints.sm) return 'sm';
  if (width < breakpoints.md) return 'md';
  if (width < breakpoints.lg) return 'lg';
  if (width < breakpoints.xl) return 'xl';
  return '2xl';
}

/**
 * Check if current viewport matches a specific breakpoint or larger
 */
export function isBreakpointOrLarger(breakpoint: Breakpoint): boolean {
  if (typeof window === 'undefined') {
    return false; // Default for SSR
  }

  const width = window.innerWidth;
  return width >= breakpoints[breakpoint];
}

/**
 * Check if current viewport is mobile (less than sm breakpoint)
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') {
    return true; // Default to mobile-first for SSR
  }

  return window.innerWidth < breakpoints.sm;
}

/**
 * Check if current viewport is tablet (sm to lg breakpoints)
 */
export function isTablet(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const width = window.innerWidth;
  return width >= breakpoints.sm && width < breakpoints.lg;
}

/**
 * Check if current viewport is desktop (lg breakpoint or larger)
 */
export function isDesktop(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerWidth >= breakpoints.lg;
}

/**
 * Generate touch-optimized spacing classes
 * Requirement 2.3: Minimum gap between touch targets
 */
export function getTouchSpacing(variant: 'standard' | 'compact' | 'spacious' = 'standard'): string {
  const spacingMap = {
    'compact': 'gap-2',      // 8px - minimum gap
    'standard': 'gap-3',     // 12px - comfortable gap
    'spacious': 'gap-4',     // 16px - spacious gap
  };

  return spacingMap[variant];
}

/**
 * Apply responsive padding that reduces on mobile
 * Requirement 4.2: Padding reduces by one step on mobile
 */
export function getResponsivePadding(
  desktop: number,
  reduceOnMobile: boolean = true
): string {
  if (!reduceOnMobile) {
    return `p-${desktop}`;
  }

  const mobile = Math.max(2, desktop - 2); // Reduce by 2 units (16px) but minimum 2 (8px)
  return cn(`p-${mobile}`, `md:p-${desktop}`);
}

/**
 * Get responsive text size classes for statistics
 * Requirements 7.1, 7.2: Prominent statistics display
 */
export function getStatisticClasses(type: 'primary' | 'secondary' | 'label'): string {
  const classMap = {
    'primary': 'text-stat-primary md:text-stat-primary-lg',     // 32px → 48px
    'secondary': 'text-stat-secondary md:text-stat-secondary-lg', // 24px → 32px
    'label': 'text-stat-label',                                  // 12px uppercase
  };

  return classMap[type];
}

/**
 * Check if the device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') {
    return true; // Assume touch for SSR
  }

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - vendor prefix
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get appropriate button size based on device type
 * Requirement 2.1: Touch devices need larger targets
 */
export function getButtonSize(): 'small' | 'medium' | 'large' {
  if (isTouchDevice() && isMobile()) {
    return 'large'; // Ensure 44px minimum height
  }

  if (isTouchDevice()) {
    return 'medium'; // Comfortable size for touch on larger screens
  }

  return 'small'; // Compact for desktop with mouse
}

/**
 * Generate grid column classes based on viewport
 * Requirements 3.1, 3.2: Responsive grid layouts
 */
export function getResponsiveGridCols(
  mobile: number = 1,
  tablet: number = 2,
  desktop: number = 3
): string {
  return cn(
    `grid-cols-${mobile}`,
    `sm:grid-cols-${tablet}`,
    `lg:grid-cols-${desktop}`
  );
}