/**
 * Feature Flags Configuration
 *
 * This module provides a centralized way to manage feature flags throughout the application.
 * Feature flags allow for conditional enabling/disabling of features based on environment
 * variables, user roles, or other conditions.
 */

export interface FeatureFlags {
  /** Enable/disable confirmation dialogs for deletions */
  confirmDeletions: boolean;
  /** Enable/disable radio settings management UI */
  radioSettings: boolean;
  /** Enable/disable real-time updates for radio player */
  realtimeUpdates: boolean;
  /** Enable/disable API rate limiting */
  rateLimiting: boolean;
  /** Enable/disable detailed API logging */
  apiLogging: boolean;
  /** Enable/disable cache mechanisms */
  caching: boolean;
  /** Enable/disable fallback stream URL mechanisms */
  streamFallback: boolean;
}

/**
 * Parse environment variable as boolean
 * Handles common boolean representations: true, false, 1, 0, yes, no
 */
function parseBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
  if (!value) return defaultValue;

  const normalizedValue = value.toLowerCase().trim();

  // Handle explicit boolean strings
  if (normalizedValue === 'true' || normalizedValue === '1' || normalizedValue === 'yes') {
    return true;
  }

  if (normalizedValue === 'false' || normalizedValue === '0' || normalizedValue === 'no') {
    return false;
  }

  return defaultValue;
}

/**
 * Get feature flags from environment variables
 * Each flag can be overridden by its corresponding environment variable
 */
function getFeatureFlagsFromEnv(): FeatureFlags {
  return {
    confirmDeletions: parseBoolean(process.env.FEATURE_CONFIRM_DELETIONS, true),
    radioSettings: parseBoolean(process.env.FEATURE_RADIO_SETTINGS, true),
    realtimeUpdates: parseBoolean(process.env.FEATURE_REALTIME_UPDATES, true),
    rateLimiting: parseBoolean(process.env.FEATURE_RATE_LIMITING, true),
    apiLogging: parseBoolean(process.env.ENABLE_API_LOGGING, false),
    caching: parseBoolean(process.env.FEATURE_CACHING, true),
    streamFallback: parseBoolean(process.env.FEATURE_STREAM_FALLBACK, true),
  };
}

/**
 * Default feature flags configuration
 * These are the default values when no environment variables are set
 */
const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  confirmDeletions: true,
  radioSettings: true,
  realtimeUpdates: true,
  rateLimiting: true,
  apiLogging: false,
  caching: true,
  streamFallback: true,
};

/**
 * Environment-specific feature flag overrides
 * Different environments may have different default values
 */
const ENVIRONMENT_OVERRIDES: Record<string, Partial<FeatureFlags>> = {
  development: {
    rateLimiting: false,
    apiLogging: true,
  },
  test: {
    confirmDeletions: false,
    rateLimiting: false,
    apiLogging: false,
    realtimeUpdates: false,
  },
  production: {
    apiLogging: false,
    rateLimiting: true,
  },
};

/**
 * Get the current environment name
 */
function getCurrentEnvironment(): string {
  return process.env.NODE_ENV || 'development';
}

/**
 * Merge feature flags from multiple sources
 * Priority: Environment Variables > Environment Overrides > Defaults
 */
function mergeFeatureFlags(): FeatureFlags {
  const environment = getCurrentEnvironment();
  const envOverrides = ENVIRONMENT_OVERRIDES[environment] || {};
  const envFlags = getFeatureFlagsFromEnv();

  return {
    ...DEFAULT_FEATURE_FLAGS,
    ...envOverrides,
    ...Object.fromEntries(
      Object.entries(envFlags).filter(([_, value]) => value !== undefined)
    ),
  };
}

/**
 * Global feature flags instance
 * This is computed once when the module is loaded
 */
export const features: FeatureFlags = mergeFeatureFlags();

/**
 * Check if a specific feature is enabled
 * @param featureName - Name of the feature to check
 * @returns Whether the feature is enabled
 */
export function isFeatureEnabled(featureName: keyof FeatureFlags): boolean {
  return features[featureName];
}

/**
 * Get all feature flags as an object
 * Useful for debugging and admin interfaces
 */
export function getAllFeatureFlags(): FeatureFlags {
  return { ...features };
}

/**
 * Feature flag hook for React components
 * @param featureName - Name of the feature to check
 * @returns Whether the feature is enabled
 *
 * @example
 * ```tsx
 * import { useFeature } from '@/lib/config/features';
 *
 * function DeleteButton() {
 *   const showConfirmation = useFeature('confirmDeletions');
 *
 *   const handleDelete = () => {
 *     if (showConfirmation) {
 *       // Show confirmation dialog
 *     } else {
 *       // Delete directly
 *     }
 *   };
 *
 *   return <button onClick={handleDelete}>Delete</button>;
 * }
 * ```
 */
export function useFeature(featureName: keyof FeatureFlags): boolean {
  return isFeatureEnabled(featureName);
}

/**
 * Conditional component wrapper based on feature flags
 * @param featureName - Name of the feature to check
 * @param children - Components to render if feature is enabled
 * @param fallback - Optional fallback to render if feature is disabled
 *
 * @example
 * ```tsx
 * import { FeatureGuard } from '@/lib/config/features';
 *
 * function AdminPanel() {
 *   return (
 *     <div>
 *       <FeatureGuard feature="radioSettings">
 *         <RadioSettingsPanel />
 *       </FeatureGuard>
 *
 *       <FeatureGuard
 *         feature="confirmDeletions"
 *         fallback={<SimpleDeleteButton />}
 *       >
 *         <ConfirmDeleteButton />
 *       </FeatureGuard>
 *     </div>
 *   );
 * }
 * ```
 */
export function FeatureGuard({
  feature,
  children,
  fallback = null,
}: {
  feature: keyof FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}): React.ReactElement | null {
  if (isFeatureEnabled(feature)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Higher-order component for feature-gated components
 * @param featureName - Name of the feature to check
 * @param fallbackComponent - Optional fallback component
 *
 * @example
 * ```tsx
 * import { withFeature } from '@/lib/config/features';
 *
 * const RadioSettingsPage = withFeature('radioSettings')(
 *   function RadioSettingsPageComponent() {
 *     return <div>Radio Settings</div>;
 *   }
 * );
 *
 * // With fallback
 * const DeleteButton = withFeature('confirmDeletions', SimpleDeleteButton)(
 *   ConfirmDeleteButton
 * );
 * ```
 */
export function withFeature<P extends object>(
  featureName: keyof FeatureFlags,
  FallbackComponent?: React.ComponentType<P>
) {
  return function <T extends React.ComponentType<P>>(Component: T): T {
    const WrappedComponent = (props: P) => {
      if (isFeatureEnabled(featureName)) {
        return <Component {...(props as any)} />;
      }

      if (FallbackComponent) {
        return <FallbackComponent {...(props as any)} />;
      }

      return null;
    };

    WrappedComponent.displayName = `withFeature(${featureName})(${Component.displayName || Component.name})`;

    return WrappedComponent as T;
  };
}

/**
 * Feature flag utilities for API endpoints
 */
export const apiFeatures = {
  /**
   * Check if rate limiting is enabled for API endpoints
   */
  isRateLimitingEnabled(): boolean {
    return isFeatureEnabled('rateLimiting');
  },

  /**
   * Check if API logging is enabled
   */
  isApiLoggingEnabled(): boolean {
    return isFeatureEnabled('apiLogging');
  },

  /**
   * Check if caching is enabled
   */
  isCachingEnabled(): boolean {
    return isFeatureEnabled('caching');
  },

  /**
   * Check if stream fallback mechanisms are enabled
   */
  isStreamFallbackEnabled(): boolean {
    return isFeatureEnabled('streamFallback');
  },
};

/**
 * Feature flag utilities for admin interfaces
 */
export const adminFeatures = {
  /**
   * Check if radio settings management is enabled
   */
  isRadioSettingsEnabled(): boolean {
    return isFeatureEnabled('radioSettings');
  },

  /**
   * Check if confirmation dialogs are enabled
   */
  isConfirmDialogsEnabled(): boolean {
    return isFeatureEnabled('confirmDeletions');
  },

  /**
   * Check if real-time updates are enabled
   */
  isRealtimeUpdatesEnabled(): boolean {
    return isFeatureEnabled('realtimeUpdates');
  },
};

/**
 * Development utilities for feature flag management
 */
export const devUtils = {
  /**
   * Log current feature flag configuration
   * Only available in development environment
   */
  logFeatureFlags(): void {
    if (getCurrentEnvironment() === 'development') {
      console.group('🏳️ Feature Flags Configuration');
      console.table(getAllFeatureFlags());
      console.groupEnd();
    }
  },

  /**
   * Get feature flag configuration as JSON string
   * Useful for debugging and configuration export
   */
  exportConfiguration(): string {
    return JSON.stringify(getAllFeatureFlags(), null, 2);
  },

  /**
   * Validate feature flag configuration
   * Checks for common misconfigurations
   */
  validateConfiguration(): { valid: boolean; warnings: string[] } {
    const flags = getAllFeatureFlags();
    const warnings: string[] = [];

    // Check for potentially problematic combinations
    if (flags.realtimeUpdates && !flags.caching) {
      warnings.push('Real-time updates enabled without caching may impact performance');
    }

    if (getCurrentEnvironment() === 'production' && flags.apiLogging) {
      warnings.push('API logging is enabled in production - consider disabling for performance');
    }

    if (!flags.rateLimiting && getCurrentEnvironment() === 'production') {
      warnings.push('Rate limiting is disabled in production - security risk');
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  },
};

/**
 * Type-safe feature flag keys
 * Use this for TypeScript autocomplete and type checking
 */
export type FeatureFlagKey = keyof FeatureFlags;

/**
 * Runtime feature flag validation
 * Ensures all required feature flags are properly configured
 */
export function validateFeatureFlags(): void {
  const requiredFlags: FeatureFlagKey[] = [
    'confirmDeletions',
    'radioSettings',
    'realtimeUpdates',
    'rateLimiting',
  ];

  const missingFlags = requiredFlags.filter(flag =>
    features[flag] === undefined || features[flag] === null
  );

  if (missingFlags.length > 0) {
    throw new Error(`Missing or invalid feature flags: ${missingFlags.join(', ')}`);
  }
}

// Validate configuration on module load
validateFeatureFlags();

// Log configuration in development
if (getCurrentEnvironment() === 'development') {
  devUtils.logFeatureFlags();

  const validation = devUtils.validateConfiguration();
  if (!validation.valid) {
    console.warn('⚠️ Feature flag configuration warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
}