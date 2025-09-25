import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    base?: 1 | 2 | 3 | 4;
    sm?: 1 | 2 | 3 | 4;
    md?: 1 | 2 | 3 | 4;
    lg?: 1 | 2 | 3 | 4;
    xl?: 1 | 2 | 3 | 4;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  mobileStack?: boolean;
  tabletColumns?: 2 | 3;
  desktopColumns?: 3 | 4;
}

const colClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

const gapClasses = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
};

const responsiveColClasses = {
  base: {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  },
  sm: {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
  },
  md: {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  },
  lg: {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
  },
  xl: {
    1: 'xl:grid-cols-1',
    2: 'xl:grid-cols-2',
    3: 'xl:grid-cols-3',
    4: 'xl:grid-cols-4',
  },
};

export function ResponsiveGrid({
  children,
  className,
  cols = { base: 1, sm: 1, md: 2, lg: 3 },
  gap = 'md',
  mobileStack = true,
  tabletColumns = 2,
  desktopColumns = 3,
}: ResponsiveGridProps) {
  // If using simplified props, construct cols object
  const gridCols = cols || {
    base: mobileStack ? 1 : 2,
    sm: mobileStack ? 1 : 2,
    md: tabletColumns,
    lg: desktopColumns,
  };

  const gridClasses = cn(
    'grid w-full',
    gapClasses[gap],
    gridCols.base && responsiveColClasses.base[gridCols.base],
    gridCols.sm && responsiveColClasses.sm[gridCols.sm],
    gridCols.md && responsiveColClasses.md[gridCols.md],
    gridCols.lg && responsiveColClasses.lg[gridCols.lg],
    gridCols.xl && responsiveColClasses.xl[gridCols.xl],
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}

// Specialized grid for admin dashboard
export function AdminDashboardGrid({
  children,
  className,
  gap = 'md',
}: {
  children: React.ReactNode;
  className?: string;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  return (
    <ResponsiveGrid
      cols={{
        base: 1,        // Mobile: single column
        sm: 1,          // Small mobile: single column
        md: 2,          // Tablet (640-1024px): exactly 2 columns
        lg: 3,          // Desktop: 3 columns
        xl: 4,          // Large desktop: 4 columns
      }}
      gap={gap}
      className={className}
    >
      {children}
    </ResponsiveGrid>
  );
}

// Specialized grid for news/content cards
export function ContentGrid({
  children,
  className,
  gap = 'lg',
}: {
  children: React.ReactNode;
  className?: string;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  return (
    <ResponsiveGrid
      cols={{
        base: 1,        // Mobile: single column for full width cards
        sm: 1,          // Small screens: single column
        md: 2,          // Tablet: 2 columns
        lg: 3,          // Desktop: 3 columns
      }}
      gap={gap}
      className={className}
    >
      {children}
    </ResponsiveGrid>
  );
}