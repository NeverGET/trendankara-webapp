/**
 * Radio Stream Fallback URL Management System
 *
 * Provides robust fallback URL management with environment variable priority,
 * automatic testing, and intelligent failover for continuous radio streaming.
 *
 * Requirements: 6.3, 6.4, 7.7
 * Features:
 * - Environment variable priority fallback URLs
 * - Automatic fallback testing and selection
 * - URL rotation for redundancy
 * - Transparent failover for radio players
 * - Comprehensive logging and monitoring
 */

import { StreamValidationResult, testStreamConnection } from '@/lib/db/queries/radioSettings';
import { RadioErrorType, RadioErrorHandler } from '@/lib/utils/radioErrorHandler';
import { logInfo, logWarning, logError, createPrefixedLogger } from '@/lib/utils/logger';

// Prefixed logger for fallback operations
const logger = createPrefixedLogger('RadioFallback');

/**
 * Fallback URL configuration with metadata
 */
export interface FallbackUrlConfig {
  /** The fallback stream URL */
  url: string;
  /** Priority level (lower number = higher priority) */
  priority: number;
  /** Source of the URL (environment, database, default) */
  source: 'environment' | 'database' | 'default';
  /** Optional description for logging */
  description?: string;
  /** Whether this URL has been tested recently */
  lastTested?: Date;
  /** Result of the last test */
  lastTestResult?: StreamValidationResult;
  /** Number of consecutive failures */
  failureCount?: number;
}

/**
 * Fallback URL rotation state
 */
interface FallbackRotationState {
  /** Current active fallback URL */
  currentUrl: string | null;
  /** Index in the fallback list */
  currentIndex: number;
  /** Last rotation timestamp */
  lastRotation: Date | null;
  /** URLs that have been tried and failed */
  failedUrls: Set<string>;
  /** Total rotation attempts */
  rotationCount: number;
}

/**
 * Configuration options for fallback URL management
 */
export interface FallbackOptions {
  /** Maximum number of URLs to test simultaneously */
  maxConcurrentTests?: number;
  /** Timeout for individual URL tests (milliseconds) */
  testTimeout?: number;
  /** Maximum number of failure retries per URL */
  maxRetries?: number;
  /** Cooldown period before retrying failed URLs (milliseconds) */
  retryCooldown?: number;
  /** Whether to use caching for test results */
  enableCaching?: boolean;
  /** Cache duration for test results (milliseconds) */
  cacheDuration?: number;
}

/**
 * Default configuration options
 */
const DEFAULT_FALLBACK_OPTIONS: Required<FallbackOptions> = {
  maxConcurrentTests: 3,
  testTimeout: 10000,
  maxRetries: 3,
  retryCooldown: 60000, // 1 minute
  enableCaching: true,
  cacheDuration: 300000, // 5 minutes
};

/**
 * Global fallback rotation state
 */
let rotationState: FallbackRotationState = {
  currentUrl: null,
  currentIndex: 0,
  lastRotation: null,
  failedUrls: new Set(),
  rotationCount: 0,
};

/**
 * Cache for fallback URL test results
 */
const testResultsCache = new Map<string, {
  result: StreamValidationResult;
  timestamp: Date;
}>();

/**
 * Get prioritized fallback URLs from multiple sources
 * Environment variables take highest priority, followed by database settings
 */
export async function getFallbackUrls(): Promise<FallbackUrlConfig[]> {
  const fallbackUrls: FallbackUrlConfig[] = [];

  try {
    // Priority 1: Primary environment fallback URL
    const envStreamUrl = process.env.RADIO_STREAM_URL;
    if (envStreamUrl && envStreamUrl.trim()) {
      fallbackUrls.push({
        url: envStreamUrl.trim(),
        priority: 1,
        source: 'environment',
        description: 'Primary environment stream URL',
      });
      logger.info('Added primary environment fallback URL');
    }

    // Priority 2: Backup environment fallback URL
    const envBackupUrl = process.env.RADIO_BACKUP_STREAM_URL;
    if (envBackupUrl && envBackupUrl.trim()) {
      fallbackUrls.push({
        url: envBackupUrl.trim(),
        priority: 2,
        source: 'environment',
        description: 'Backup environment stream URL',
      });
      logger.info('Added backup environment fallback URL');
    }

    // Priority 3: Multiple environment fallback URLs (comma-separated)
    const envFallbackUrls = process.env.RADIO_FALLBACK_URLS;
    if (envFallbackUrls && envFallbackUrls.trim()) {
      const urls = envFallbackUrls.split(',').map(url => url.trim()).filter(Boolean);
      urls.forEach((url, index) => {
        fallbackUrls.push({
          url,
          priority: 10 + index,
          source: 'environment',
          description: `Environment fallback URL ${index + 1}`,
        });
      });
      logger.info(`Added ${urls.length} additional environment fallback URLs`);
    }

    // Priority 4: Database fallback URLs
    try {
      const { getFallbackUrl } = await import('@/lib/db/queries/radioSettings');
      const dbFallbackUrl = await getFallbackUrl();

      if (dbFallbackUrl && dbFallbackUrl.trim()) {
        // Avoid duplicates with environment URLs
        const isDuplicate = fallbackUrls.some(config => config.url === dbFallbackUrl.trim());
        if (!isDuplicate) {
          fallbackUrls.push({
            url: dbFallbackUrl.trim(),
            priority: 50,
            source: 'database',
            description: 'Database fallback stream URL',
          });
          logger.info('Added database fallback URL');
        }
      }
    } catch (error) {
      logger.warning(`Failed to retrieve database fallback URL: ${error}`);
    }

    // Priority 5: Default fallback URLs (hardcoded reliable sources)
    const defaultFallbacks = [
      'https://radyo.yayin.com.tr:5132/stream',
      'https://stream.radyotrendankara.com/listen',
    ];

    defaultFallbacks.forEach((url, index) => {
      const isDuplicate = fallbackUrls.some(config => config.url === url);
      if (!isDuplicate) {
        fallbackUrls.push({
          url,
          priority: 100 + index,
          source: 'default',
          description: `Default fallback URL ${index + 1}`,
        });
      }
    });

    // Sort by priority (lower number = higher priority)
    fallbackUrls.sort((a, b) => a.priority - b.priority);

    logger.info(`Collected ${fallbackUrls.length} fallback URLs`);
    return fallbackUrls;

  } catch (error) {
    logger.error(`Error collecting fallback URLs: ${error}`);

    // Return minimal default fallback
    return [{
      url: 'https://radyo.yayin.com.tr:5132/stream',
      priority: 999,
      source: 'default',
      description: 'Emergency default fallback URL',
    }];
  }
}

/**
 * Test multiple fallback URLs concurrently and return the first working one
 */
export async function testFallbackUrls(
  urls: FallbackUrlConfig[],
  options: FallbackOptions = {}
): Promise<FallbackUrlConfig | null> {
  const config = { ...DEFAULT_FALLBACK_OPTIONS, ...options };

  if (urls.length === 0) {
    logger.warning('No fallback URLs to test');
    return null;
  }

  logger.info(`Testing ${urls.length} fallback URLs with max concurrency ${config.maxConcurrentTests}`);

  // Filter out URLs that are in cooldown period
  const now = new Date();
  const testableUrls = urls.filter(urlConfig => {
    if (!urlConfig.failureCount || urlConfig.failureCount === 0) {
      return true;
    }

    if (!urlConfig.lastTested) {
      return true;
    }

    const timeSinceLastTest = now.getTime() - urlConfig.lastTested.getTime();
    return timeSinceLastTest >= config.retryCooldown;
  });

  if (testableUrls.length === 0) {
    logger.warning('All fallback URLs are in cooldown period');
    return null;
  }

  // Test URLs in batches based on concurrency limit
  const batchSize = config.maxConcurrentTests;
  let workingUrl: FallbackUrlConfig | null = null;

  for (let i = 0; i < testableUrls.length && !workingUrl; i += batchSize) {
    const batch = testableUrls.slice(i, i + batchSize);

    logger.info(`Testing batch ${Math.floor(i / batchSize) + 1}: ${batch.length} URLs`);

    const batchPromises = batch.map(async (urlConfig) => {
      try {
        // Check cache first if enabled
        if (config.enableCaching) {
          const cached = testResultsCache.get(urlConfig.url);
          if (cached && (now.getTime() - cached.timestamp.getTime()) < config.cacheDuration) {
            logger.info(`Using cached test result for ${urlConfig.url}`);
            urlConfig.lastTestResult = cached.result;
            urlConfig.lastTested = cached.timestamp;
            return { urlConfig, testResult: cached.result };
          }
        }

        // Perform the test
        logger.info(`Testing fallback URL: ${urlConfig.url} (${urlConfig.description})`);
        const testResult = await testStreamConnection(urlConfig.url);

        // Update URL config with test results
        urlConfig.lastTested = now;
        urlConfig.lastTestResult = testResult;

        if (!testResult.isValid) {
          urlConfig.failureCount = (urlConfig.failureCount || 0) + 1;
          logger.warning(`Fallback URL failed: ${urlConfig.url} - ${testResult.error}`);
        } else {
          urlConfig.failureCount = 0; // Reset failure count on success
          logger.info(`Fallback URL successful: ${urlConfig.url} (${testResult.responseTime}ms)`);
        }

        // Cache the result if enabled
        if (config.enableCaching) {
          testResultsCache.set(urlConfig.url, {
            result: testResult,
            timestamp: now,
          });
        }

        return { urlConfig, testResult };
      } catch (error) {
        logger.error(`Error testing fallback URL ${urlConfig.url}: ${error}`);
        urlConfig.failureCount = (urlConfig.failureCount || 0) + 1;
        urlConfig.lastTested = now;
        return { urlConfig, testResult: null };
      }
    });

    // Wait for batch completion
    const batchResults = await Promise.allSettled(batchPromises);

    // Find the first working URL in this batch
    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value.testResult?.isValid) {
        workingUrl = result.value.urlConfig;
        break;
      }
    }

    if (workingUrl) {
      logger.info(`Found working fallback URL: ${workingUrl.url}`);
      break;
    }
  }

  return workingUrl;
}

/**
 * Get the best available fallback URL with automatic testing
 */
export async function getFallbackUrl(options: FallbackOptions = {}): Promise<string | null> {
  try {
    logger.info('Getting fallback URL with automatic testing');

    // Get all available fallback URLs
    const fallbackUrls = await getFallbackUrls();

    if (fallbackUrls.length === 0) {
      logger.error('No fallback URLs available');
      return null;
    }

    // Test fallback URLs and get the first working one
    const workingUrl = await testFallbackUrls(fallbackUrls, options);

    if (workingUrl) {
      logger.info(`Selected fallback URL: ${workingUrl.url} (${workingUrl.source})`);
      return workingUrl.url;
    }

    // No working URLs found, return the highest priority one as last resort
    logger.warning('No working fallback URLs found, returning highest priority URL');
    return fallbackUrls[0].url;

  } catch (error) {
    const radioError = RadioErrorHandler.createError(RadioErrorType.NETWORK_CONNECTION_FAILED, 'Failed to get fallback URL', { error });
    logger.error(`Error getting fallback URL: ${radioError.technicalMessage}`);
    return null;
  }
}

/**
 * Rotate to the next available fallback URL
 */
export async function rotateToNextFallback(
  currentFailedUrl: string,
  options: FallbackOptions = {}
): Promise<string | null> {
  try {
    logger.info(`Rotating from failed URL: ${currentFailedUrl}`);

    // Mark current URL as failed
    rotationState.failedUrls.add(currentFailedUrl);
    rotationState.rotationCount += 1;
    rotationState.lastRotation = new Date();

    // Get all available fallback URLs
    const fallbackUrls = await getFallbackUrls();

    // Filter out failed URLs
    const availableUrls = fallbackUrls.filter(config =>
      !rotationState.failedUrls.has(config.url) && config.url !== currentFailedUrl
    );

    if (availableUrls.length === 0) {
      logger.warning('All fallback URLs have failed, resetting rotation state');
      // Reset failed URLs set and try again
      rotationState.failedUrls.clear();
      rotationState.currentIndex = 0;

      const resetUrls = fallbackUrls.filter(config => config.url !== currentFailedUrl);
      if (resetUrls.length > 0) {
        const nextUrl = await testFallbackUrls(resetUrls, options);
        if (nextUrl) {
          rotationState.currentUrl = nextUrl.url;
          rotationState.currentIndex = fallbackUrls.findIndex(config => config.url === nextUrl.url);
          return nextUrl.url;
        }
      }

      return null;
    }

    // Test available URLs and get the next working one
    const nextWorkingUrl = await testFallbackUrls(availableUrls, options);

    if (nextWorkingUrl) {
      rotationState.currentUrl = nextWorkingUrl.url;
      rotationState.currentIndex = fallbackUrls.findIndex(config => config.url === nextWorkingUrl.url);

      logger.info(`Rotated to next fallback URL: ${nextWorkingUrl.url} (attempt ${rotationState.rotationCount})`);
      return nextWorkingUrl.url;
    }

    logger.error('No working fallback URLs available after rotation');
    return null;

  } catch (error) {
    const radioError = RadioErrorHandler.createError(RadioErrorType.NETWORK_CONNECTION_FAILED, 'Failed to rotate fallback URL', { error });
    logger.error(`Error during fallback URL rotation: ${radioError.technicalMessage}`);
    return null;
  }
}

/**
 * Get current rotation state for monitoring
 */
export function getRotationState(): Readonly<FallbackRotationState> {
  return {
    ...rotationState,
    failedUrls: new Set(rotationState.failedUrls), // Return a copy
  };
}

/**
 * Reset rotation state (useful for testing or manual reset)
 */
export function resetRotationState(): void {
  logger.info('Resetting fallback URL rotation state');
  rotationState = {
    currentUrl: null,
    currentIndex: 0,
    lastRotation: null,
    failedUrls: new Set(),
    rotationCount: 0,
  };
}

/**
 * Clear test results cache
 */
export function clearTestCache(): void {
  logger.info('Clearing fallback URL test cache');
  testResultsCache.clear();
}

/**
 * Get comprehensive fallback URL status for monitoring
 */
export async function getFallbackStatus(): Promise<{
  availableUrls: FallbackUrlConfig[];
  rotationState: Readonly<FallbackRotationState>;
  cacheSize: number;
  recommendations: string[];
}> {
  try {
    const urls = await getFallbackUrls();
    const state = getRotationState();
    const recommendations: string[] = [];

    // Generate recommendations based on current state
    if (urls.length < 3) {
      recommendations.push('Consider adding more fallback URLs for better redundancy');
    }

    if (state.rotationCount > 10) {
      recommendations.push('High rotation count detected - investigate primary stream stability');
    }

    if (state.failedUrls.size > urls.length / 2) {
      recommendations.push('More than half of fallback URLs have failed - check network connectivity');
    }

    const envUrlsCount = urls.filter(u => u.source === 'environment').length;
    if (envUrlsCount === 0) {
      recommendations.push('No environment fallback URLs configured - add RADIO_BACKUP_STREAM_URL');
    }

    return {
      availableUrls: urls,
      rotationState: state,
      cacheSize: testResultsCache.size,
      recommendations,
    };

  } catch (error) {
    logger.error(`Error getting fallback status: ${error}`);
    throw error;
  }
}

/**
 * Test and validate all configured fallback URLs
 * Useful for health checks and monitoring
 */
export async function validateAllFallbackUrls(options: FallbackOptions = {}): Promise<{
  total: number;
  working: number;
  failed: number;
  results: Array<{
    url: string;
    source: string;
    priority: number;
    isWorking: boolean;
    error?: string;
    responseTime?: number;
  }>;
}> {
  try {
    logger.info('Validating all fallback URLs');

    const urls = await getFallbackUrls();
    const results = [];
    let working = 0;
    let failed = 0;

    // Test all URLs concurrently with higher concurrency for validation
    const testPromises = urls.map(async (urlConfig) => {
      try {
        const testResult = await testStreamConnection(urlConfig.url);
        const isWorking = testResult.isValid;

        if (isWorking) {
          working++;
        } else {
          failed++;
        }

        return {
          url: urlConfig.url,
          source: urlConfig.source,
          priority: urlConfig.priority,
          isWorking,
          error: testResult.error,
          responseTime: testResult.responseTime,
        };
      } catch (error) {
        failed++;
        return {
          url: urlConfig.url,
          source: urlConfig.source,
          priority: urlConfig.priority,
          isWorking: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const testResults = await Promise.all(testPromises);

    logger.info(`Validation complete: ${working} working, ${failed} failed out of ${urls.length} total`);

    return {
      total: urls.length,
      working,
      failed,
      results: testResults,
    };

  } catch (error) {
    logger.error(`Error validating fallback URLs: ${error}`);
    throw error;
  }
}