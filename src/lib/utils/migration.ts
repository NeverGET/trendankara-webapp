/**
 * Migration Compatibility Utilities
 * Provides backward compatibility for legacy size systems while transitioning to responsive design
 */

// Legacy size mappings
const legacySizeMap: Record<string, string> = {
  // Legacy button sizes
  'px-2 py-1': 'px-3 py-1.5 md:px-4 md:py-2',
  'px-3 py-1.5': 'px-3 py-1.5 md:px-4 md:py-2',
  'px-4 py-2': 'px-4 py-2 md:px-5 md:py-2.5',
  'px-6 py-3': 'px-5 py-2.5 md:px-6 md:py-3',

  // Legacy text sizes
  'text-xs': 'text-xs md:text-sm',
  'text-sm': 'text-sm md:text-base',
  'text-base': 'text-sm md:text-base',
  'text-lg': 'text-base md:text-lg',
  'text-xl': 'text-lg md:text-xl',
  'text-2xl': 'text-xl md:text-2xl',
  'text-3xl': 'text-2xl md:text-3xl',
  'text-4xl': 'text-3xl md:text-4xl',

  // Legacy spacing
  'p-2': 'p-2 md:p-3',
  'p-3': 'p-3 md:p-4',
  'p-4': 'p-4 md:p-6',
  'p-6': 'p-4 md:p-6',
  'p-8': 'p-6 md:p-8',

  // Legacy margins
  'm-2': 'm-2 md:m-3',
  'm-3': 'm-3 md:m-4',
  'm-4': 'm-4 md:m-6',
  'm-6': 'm-4 md:m-6',

  // Legacy gaps
  'gap-2': 'gap-2 md:gap-3',
  'gap-3': 'gap-3 md:gap-4',
  'gap-4': 'gap-4 md:gap-6',
  'gap-6': 'gap-4 md:gap-6',

  // Legacy heights (convert to touch-friendly)
  'h-8': 'min-h-[40px] md:h-10',
  'h-10': 'min-h-[44px] md:h-12',
  'h-12': 'min-h-[44px] md:h-12',
};

// Component-specific migrations
const componentSizeMigrations: Record<string, Record<string, string>> = {
  Button: {
    small: 'size="small"',
    medium: 'size="medium"',
    large: 'size="large"',
    giant: 'size="giant"',
  },
  Input: {
    small: 'className="h-10 md:h-11"',
    medium: 'className="h-11 md:h-12"',
    large: 'className="h-12 md:h-14"',
  },
  Modal: {
    small: 'size="small"',
    medium: 'size="medium"',
    large: 'size="large"',
    fullscreen: 'size="fullscreen"',
  },
};

/**
 * Maps legacy size classes to responsive equivalents
 */
export function mapLegacySize(oldSize: string): string {
  if (legacySizeMap[oldSize]) {
    return legacySizeMap[oldSize];
  }

  // Handle compound classes (e.g., "px-4 py-2 text-sm")
  const classes = oldSize.split(' ');
  const mappedClasses = classes.map(cls => legacySizeMap[cls] || cls);

  return mappedClasses.join(' ');
}

/**
 * Warns about deprecated sizing patterns in development
 */
export function warnDeprecatedSizing(component: string, prop: string, value?: string): void {
  if (process.env.NODE_ENV !== 'development') return;

  const message = value
    ? `🚨 Deprecated sizing in ${component}: "${prop}=${value}". Consider updating to responsive design system.`
    : `🚨 Deprecated sizing in ${component}: "${prop}". Consider updating to responsive design system.`;

  console.warn(message);

  // Provide migration suggestion if available
  if (componentSizeMigrations[component]?.[value || prop]) {
    console.info(`💡 Suggestion: Use ${componentSizeMigrations[component][value || prop]}`);
  }
}

/**
 * Converts pixel values to responsive classes
 */
export function pxToResponsiveClass(px: number, property: 'width' | 'height' | 'padding' | 'margin' = 'padding'): string {
  const responsive = {
    padding: {
      8: 'p-2 md:p-3',
      12: 'p-3 md:p-4',
      16: 'p-4 md:p-6',
      20: 'p-5 md:p-6',
      24: 'p-6 md:p-8',
      32: 'p-8 md:p-10',
    },
    margin: {
      8: 'm-2 md:m-3',
      12: 'm-3 md:m-4',
      16: 'm-4 md:m-6',
      20: 'm-5 md:m-6',
      24: 'm-6 md:m-8',
      32: 'm-8 md:m-10',
    },
    width: {
      32: 'w-8 md:w-10',
      40: 'w-10 md:w-12',
      48: 'w-12 md:w-14',
      56: 'w-14 md:w-16',
      64: 'w-16 md:w-20',
    },
    height: {
      32: 'min-h-[40px] md:h-10',
      40: 'min-h-[44px] md:h-12',
      44: 'min-h-[44px] md:h-12',
      48: 'min-h-[44px] md:h-12',
      56: 'min-h-[44px] md:h-14',
    },
  };

  return responsive[property][px as keyof typeof responsive[typeof property]] || `${property}-[${px}px]`;
}

/**
 * Validates and converts legacy component props
 */
export function migrateLegacyProps(component: string, props: Record<string, any>): Record<string, any> {
  const migratedProps = { ...props };

  // Component-specific migrations
  switch (component) {
    case 'Button':
      if (props.size && !['small', 'medium', 'large', 'giant'].includes(props.size)) {
        warnDeprecatedSizing('Button', 'size', props.size);
        migratedProps.size = 'medium'; // default fallback
      }
      break;

    case 'Input':
      if (props.height && typeof props.height === 'number') {
        warnDeprecatedSizing('Input', 'height', props.height.toString());
        migratedProps.className = `${props.className || ''} ${pxToResponsiveClass(props.height, 'height')}`.trim();
        delete migratedProps.height;
      }
      break;

    case 'Modal':
      if (props.width && typeof props.width === 'number') {
        warnDeprecatedSizing('Modal', 'width', props.width.toString());
        // Convert to size prop based on width
        if (props.width < 400) migratedProps.size = 'small';
        else if (props.width < 600) migratedProps.size = 'medium';
        else migratedProps.size = 'large';
        delete migratedProps.width;
      }
      break;
  }

  return migratedProps;
}

/**
 * Creates a HOC that applies migration compatibility
 */
export function withMigrationCompat<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  componentName: string
) {
  return function MigratedComponent(props: T) {
    const migratedProps = migrateLegacyProps(componentName, props);
    return React.createElement(Component as any, migratedProps as any);
  };
}

/**
 * Development helper to scan for hardcoded pixel values
 */
export function scanForHardcodedValues(element: HTMLElement): string[] {
  const warnings: string[] = [];
  const computedStyle = window.getComputedStyle(element);

  // Check for hardcoded pixel values that should be responsive
  const properties = ['fontSize', 'padding', 'margin', 'height', 'minHeight'];

  properties.forEach(prop => {
    const value = computedStyle.getPropertyValue(prop);
    if (value.includes('px') && !value.includes('1px')) { // Ignore borders
      const pxValue = parseInt(value);
      if (pxValue > 8) { // Ignore very small values
        warnings.push(`⚠️ Hardcoded ${prop}: ${value} - Consider using responsive classes`);
      }
    }
  });

  return warnings;
}

// React import for withMigrationCompat
import React from 'react';