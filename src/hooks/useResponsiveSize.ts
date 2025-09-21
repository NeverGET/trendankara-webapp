'use client';

import { useState, useEffect, useCallback } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface BreakpointConfig {
  xs: number;  // 0px
  sm: number;  // 640px
  md: number;  // 768px
  lg: number;  // 1024px
  xl: number;  // 1280px
  '2xl': number; // 1536px
}

export interface ResponsiveValue<T> {
  base?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}

const breakpoints: BreakpointConfig = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Hook to detect current responsive breakpoint
 */
export function useBreakpoint() {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('xs');
  const [windowWidth, setWindowWidth] = useState<number>(0);

  const updateBreakpoint = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    setWindowWidth(width);

    let newBreakpoint: Breakpoint = 'xs';

    if (width >= breakpoints['2xl']) {
      newBreakpoint = '2xl';
    } else if (width >= breakpoints.xl) {
      newBreakpoint = 'xl';
    } else if (width >= breakpoints.lg) {
      newBreakpoint = 'lg';
    } else if (width >= breakpoints.md) {
      newBreakpoint = 'md';
    } else if (width >= breakpoints.sm) {
      newBreakpoint = 'sm';
    }

    setCurrentBreakpoint(newBreakpoint);
  }, []);

  useEffect(() => {
    // Initialize on mount
    updateBreakpoint();

    // Set up resize listener
    const handleResize = () => {
      requestAnimationFrame(updateBreakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateBreakpoint]);

  const isBreakpoint = useCallback((bp: Breakpoint) => {
    return windowWidth >= breakpoints[bp];
  }, [windowWidth]);

  const isAbove = useCallback((bp: Breakpoint) => {
    return windowWidth >= breakpoints[bp];
  }, [windowWidth]);

  const isBelow = useCallback((bp: Breakpoint) => {
    return windowWidth < breakpoints[bp];
  }, [windowWidth]);

  const isBetween = useCallback((min: Breakpoint, max: Breakpoint) => {
    return windowWidth >= breakpoints[min] && windowWidth < breakpoints[max];
  }, [windowWidth]);

  return {
    current: currentBreakpoint,
    width: windowWidth,
    isBreakpoint,
    isAbove,
    isBelow,
    isBetween,
    // Convenience flags
    isMobile: windowWidth < breakpoints.md,
    isTablet: windowWidth >= breakpoints.md && windowWidth < breakpoints.lg,
    isDesktop: windowWidth >= breakpoints.lg,
    isSmallScreen: windowWidth < breakpoints.lg,
    isLargeScreen: windowWidth >= breakpoints.xl,
  };
}

/**
 * Hook to get responsive values based on current breakpoint
 */
export function useResponsiveValue<T>(values: ResponsiveValue<T>): T | undefined {
  const { current } = useBreakpoint();

  return useCallback(() => {
    // Get the appropriate value for current breakpoint
    // Fall back to smaller breakpoints if current not defined
    const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm'];
    const currentIndex = breakpointOrder.indexOf(current);

    // Check current and all smaller breakpoints
    for (let i = currentIndex; i < breakpointOrder.length; i++) {
      const bp = breakpointOrder[i];
      if (values[bp] !== undefined) {
        return values[bp];
      }
    }

    // Fall back to base value
    return values.base;
  }, [values, current])();
}

/**
 * Hook for responsive size calculations
 */
export function useResponsiveSize() {
  const breakpoint = useBreakpoint();

  const getSize = useCallback(<T>(sizes: ResponsiveValue<T>): T | undefined => {
    const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm'];
    const currentIndex = breakpointOrder.indexOf(breakpoint.current);

    // Check current and all smaller breakpoints
    for (let i = currentIndex; i < breakpointOrder.length; i++) {
      const bp = breakpointOrder[i];
      if (sizes[bp] !== undefined) {
        return sizes[bp];
      }
    }

    return sizes.base;
  }, [breakpoint.current]);

  const getTouchTargetSize = useCallback(() => {
    if (breakpoint.isMobile) {
      return { width: 44, height: 44 }; // WCAG minimum
    }
    return { width: 40, height: 40 }; // Desktop comfortable
  }, [breakpoint.isMobile]);

  const getSpacing = useCallback((scale: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl') => {
    const spacingMap = {
      xs: { mobile: 4, desktop: 4 },
      sm: { mobile: 8, desktop: 8 },
      md: { mobile: 12, desktop: 16 },
      lg: { mobile: 16, desktop: 24 },
      xl: { mobile: 20, desktop: 32 },
      '2xl': { mobile: 24, desktop: 40 },
      '3xl': { mobile: 32, desktop: 48 },
      '4xl': { mobile: 40, desktop: 64 },
    };

    return breakpoint.isMobile
      ? spacingMap[scale].mobile
      : spacingMap[scale].desktop;
  }, [breakpoint.isMobile]);

  const getFontSize = useCallback((type: 'body' | 'heading' | 'stat-primary' | 'stat-secondary' | 'stat-label') => {
    const fontSizeMap = {
      body: { mobile: 14, desktop: 16 },
      heading: { mobile: 18, desktop: 24 },
      'stat-primary': { mobile: 32, desktop: 48 },
      'stat-secondary': { mobile: 24, desktop: 32 },
      'stat-label': { mobile: 12, desktop: 12 },
    };

    return breakpoint.isMobile
      ? fontSizeMap[type].mobile
      : fontSizeMap[type].desktop;
  }, [breakpoint.isMobile]);

  const getGridColumns = useCallback((config: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  }) => {
    if (breakpoint.isDesktop && config.desktop) {
      return config.desktop;
    }
    if (breakpoint.isTablet && config.tablet) {
      return config.tablet;
    }
    return config.mobile || 1;
  }, [breakpoint.isDesktop, breakpoint.isTablet]);

  return {
    breakpoint,
    getSize,
    getTouchTargetSize,
    getSpacing,
    getFontSize,
    getGridColumns,
  };
}

/**
 * Hook for responsive class names
 */
export function useResponsiveClasses() {
  const { breakpoint } = useResponsiveSize();

  const getResponsiveClass = useCallback((classes: ResponsiveValue<string>): string => {
    const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm'];
    const currentIndex = breakpointOrder.indexOf(breakpoint.current);

    const classList: string[] = [];

    // Add base class
    if (classes.base) {
      classList.push(classes.base);
    }

    // Add breakpoint-specific classes
    for (let i = currentIndex; i >= 0; i--) {
      const bp = breakpointOrder[i];
      if (classes[bp]) {
        classList.push(classes[bp]!);
        break; // Only add the most specific class
      }
    }

    return classList.join(' ');
  }, [breakpoint.current]);

  return {
    getResponsiveClass,
    breakpoint,
  };
}

/**
 * Development helper to log current responsive state
 */
export function useResponsiveDebug() {
  const breakpoint = useBreakpoint();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📱 Responsive Debug:', {
        breakpoint: breakpoint.current,
        width: breakpoint.width,
        isMobile: breakpoint.isMobile,
        isTablet: breakpoint.isTablet,
        isDesktop: breakpoint.isDesktop,
      });
    }
  }, [breakpoint]);

  return breakpoint;
}