/**
 * Radio Configuration Health Monitoring System
 *
 * Provides proactive monitoring and automatic recovery for radio streaming URLs
 * with comprehensive health checking, failover management, and status reporting.
 *
 * Requirements: 4.5, 6.3, 7.7
 * Features:
 * - Periodic stream URL health checking with configurable intervals
 * - Automatic failover to backup URLs on primary failure
 * - Health status reporting for admin dashboard monitoring
 * - Event-driven notifications for health state changes
 * - Comprehensive logging and error handling
 * - Integration with existing fallback URL management
 */

import { StreamValidationResult, testStreamConnection, getActiveSettings } from '@/lib/db/queries/radioSettings';
import { getFallbackUrls, testFallbackUrls, rotateToNextFallback, FallbackUrlConfig } from '@/lib/utils/radioFallback';
import { RadioErrorType, RadioErrorHandler } from '@/lib/utils/radioErrorHandler';
import { broadcastConfigurationReload, safeBroadcastEvent, RADIO_EVENT_NAMES, RadioConfigurationReloadEvent } from '@/lib/utils/radioEvents';
import { logInfo, logWarning, logError, createPrefixedLogger } from '@/lib/utils/logger';

// Prefixed logger for health monitoring operations
const logger = createPrefixedLogger('RadioHealth');

/**
 * Health status levels for stream URLs
 */
export enum HealthStatus {
  HEALTHY = 'healthy',           // All systems operational
  DEGRADED = 'degraded',         // Minor issues, backup systems active
  UNHEALTHY = 'unhealthy',       // Primary systems failing, using fallbacks
  CRITICAL = 'critical',         // All systems failing
  UNKNOWN = 'unknown'            // Status cannot be determined
}

/**
 * Health check configuration options
 */
export interface HealthMonitorConfig {
  /** Health check interval in milliseconds (default: 60000 - 1 minute) */
  checkInterval?: number;
  /** Connection timeout for health checks in milliseconds (default: 10000) */
  connectionTimeout?: number;
  /** Number of consecutive failures before marking as unhealthy (default: 3) */
  failureThreshold?: number;
  /** Number of consecutive successes to mark as healthy again (default: 2) */
  recoveryThreshold?: number;
  /** Maximum number of concurrent health checks (default: 3) */
  maxConcurrentChecks?: number;
  /** Whether to enable automatic failover (default: true) */
  enableAutoFailover?: boolean;
  /** Cooldown period between failover attempts in milliseconds (default: 300000 - 5 minutes) */
  failoverCooldown?: number;
  /** Whether to broadcast health events (default: true) */
  enableEventBroadcasting?: boolean;
  /** Whether to enable detailed logging (default: true) */
  enableDetailedLogging?: boolean;
}

/**
 * Default health monitor configuration
 */
const DEFAULT_HEALTH_CONFIG: Required<HealthMonitorConfig> = {
  checkInterval: 60000,           // 1 minute
  connectionTimeout: 10000,       // 10 seconds
  failureThreshold: 3,            // 3 consecutive failures
  recoveryThreshold: 2,           // 2 consecutive successes
  maxConcurrentChecks: 3,         // 3 concurrent checks
  enableAutoFailover: true,       // Auto failover enabled
  failoverCooldown: 300000,       // 5 minutes
  enableEventBroadcasting: true,  // Event broadcasting enabled
  enableDetailedLogging: true     // Detailed logging enabled
};

/**
 * Health check result for individual URLs
 */
export interface HealthCheckResult {
  /** The URL that was checked */
  url: string;
  /** Current health status */
  status: HealthStatus;
  /** Timestamp of the check */
  timestamp: Date;
  /** Response time in milliseconds */
  responseTime?: number;
  /** HTTP status code if applicable */
  statusCode?: number;
  /** Error message if unhealthy */
  error?: string;
  /** Whether this is a fallback URL */
  isFallback: boolean;
  /** Priority level of this URL */
  priority?: number;
  /** Source of the URL (database, environment, default) */
  source?: string;
}

/**
 * Overall system health status
 */
export interface SystemHealthStatus {
  /** Overall health status */
  overallStatus: HealthStatus;
  /** Timestamp of the status */
  timestamp: Date;
  /** Primary stream URL status */
  primaryUrl?: HealthCheckResult;
  /** Active fallback URL status */
  activeFallback?: HealthCheckResult;
  /** All available URLs and their status */
  availableUrls: HealthCheckResult[];
  /** Current failure count */
  consecutiveFailures: number;
  /** Current success count since last failure */
  consecutiveSuccesses: number;
  /** Last successful URL */
  lastWorkingUrl?: string;
  /** Last failover timestamp */
  lastFailover?: Date;
  /** Total number of failovers */
  totalFailovers: number;
  /** Health check statistics */
  statistics: {
    totalChecks: number;
    successfulChecks: number;
    failedChecks: number;
    averageResponseTime: number;
    uptimePercentage: number;
  };
  /** Recommendations for improving health */
  recommendations: string[];
}

/**
 * Health monitoring state management
 */
interface HealthMonitorState {
  /** Whether monitoring is currently active */
  isActive: boolean;
  /** Current system health status */
  currentStatus: SystemHealthStatus;
  /** Monitor configuration */
  config: Required<HealthMonitorConfig>;
  /** Monitoring interval ID */
  intervalId?: NodeJS.Timeout;
  /** Currently active checks */
  activeChecks: Set<string>;
  /** Check history for statistics */
  checkHistory: HealthCheckResult[];
  /** Maximum history size */
  maxHistorySize: number;
}

/**
 * Global health monitoring state
 */
let monitorState: HealthMonitorState = {
  isActive: false,
  currentStatus: {
    overallStatus: HealthStatus.UNKNOWN,
    timestamp: new Date(),
    availableUrls: [],
    consecutiveFailures: 0,
    consecutiveSuccesses: 0,
    totalFailovers: 0,
    statistics: {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      averageResponseTime: 0,
      uptimePercentage: 0
    },
    recommendations: []
  },
  config: DEFAULT_HEALTH_CONFIG,
  activeChecks: new Set(),
  checkHistory: [],
  maxHistorySize: 1000
};

/**
 * Start health monitoring with optional configuration
 */
export async function startHealthMonitoring(config: HealthMonitorConfig = {}): Promise<void> {
  try {
    if (monitorState.isActive) {
      logger.warning('Health monitoring is already active');
      return;
    }

    // Merge configuration with defaults
    monitorState.config = { ...DEFAULT_HEALTH_CONFIG, ...config };
    monitorState.isActive = true;

    logger.info(`Starting health monitoring with ${monitorState.config.checkInterval}ms interval`);

    // Perform initial health check
    await performHealthCheck();

    // Set up periodic health checks
    monitorState.intervalId = setInterval(async () => {
      try {
        await performHealthCheck();
      } catch (error) {
        logger.error(`Error during periodic health check: ${error instanceof Error ? error.message : 'Unknown error'}`);
        const radioError = RadioErrorHandler.createError(RadioErrorType.INTERNAL_SERVER_ERROR, 'Periodic health check failed', { error });
        logger.error(`Periodic health check failed: ${radioError.technicalMessage}`);
      }
    }, monitorState.config.checkInterval);

    logger.info('Health monitoring started successfully');

    // Broadcast monitoring started event
    if (monitorState.config.enableEventBroadcasting) {
      broadcastHealthEvent('monitoring_started', 'normal');
    }

  } catch (error) {
    logger.error(`Failed to start health monitoring: ${error instanceof Error ? error.message : 'Unknown error'}`);
    monitorState.isActive = false;
    throw error;
  }
}

/**
 * Stop health monitoring
 */
export function stopHealthMonitoring(): void {
  if (!monitorState.isActive) {
    logger.warning('Health monitoring is not currently active');
    return;
  }

  if (monitorState.intervalId) {
    clearInterval(monitorState.intervalId);
    monitorState.intervalId = undefined;
  }

  monitorState.isActive = false;
  logger.info('Health monitoring stopped');

  // Broadcast monitoring stopped event
  if (monitorState.config.enableEventBroadcasting) {
    broadcastHealthEvent('monitoring_stopped', 'normal');
  }
}

/**
 * Perform a comprehensive health check of all configured URLs
 */
export async function performHealthCheck(): Promise<SystemHealthStatus> {
  const startTime = Date.now();

  try {
    logger.info('Performing comprehensive health check');

    // Get all available URLs (primary + fallbacks)
    const [activeSettings, fallbackUrls] = await Promise.all([
      getActiveSettings(),
      getFallbackUrls()
    ]);

    const urlsToCheck: Array<{ url: string; priority: number; source: string; isFallback: boolean }> = [];

    // Add primary URL if available
    if (activeSettings?.stream_url) {
      urlsToCheck.push({
        url: activeSettings.stream_url,
        priority: 0,
        source: 'database',
        isFallback: false
      });
    }

    // Add fallback URLs
    fallbackUrls.forEach((fallback, index) => {
      urlsToCheck.push({
        url: fallback.url,
        priority: fallback.priority,
        source: fallback.source,
        isFallback: true
      });
    });

    if (urlsToCheck.length === 0) {
      logger.warning('No URLs configured for health checking');
      return updateHealthStatus([], HealthStatus.CRITICAL, 'No URLs configured');
    }

    // Perform health checks with concurrency limit
    const healthResults = await performConcurrentHealthChecks(urlsToCheck);

    // Analyze results and determine overall health
    const overallStatus = analyzeOverallHealth(healthResults);

    // Check for automatic failover conditions
    if (monitorState.config.enableAutoFailover) {
      await checkAutoFailoverConditions(healthResults);
    }

    // Update health status
    const systemStatus = updateHealthStatus(healthResults, overallStatus);

    // Generate recommendations
    systemStatus.recommendations = generateHealthRecommendations(systemStatus);

    // Log detailed results if enabled
    if (monitorState.config.enableDetailedLogging) {
      logHealthCheckResults(systemStatus, Date.now() - startTime);
    }

    // Broadcast health update event
    if (monitorState.config.enableEventBroadcasting) {
      broadcastHealthStatusUpdate(systemStatus);
    }

    return systemStatus;

  } catch (error) {
    logger.error(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

    const errorStatus = updateHealthStatus([], HealthStatus.CRITICAL,
      `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

    const radioError = RadioErrorHandler.createError(RadioErrorType.INTERNAL_SERVER_ERROR, 'Health check operation failed', { error });
    logger.error(`Health check operation failed: ${radioError.technicalMessage}`);

    return errorStatus;
  }
}

/**
 * Perform concurrent health checks with rate limiting
 */
async function performConcurrentHealthChecks(
  urls: Array<{ url: string; priority: number; source: string; isFallback: boolean }>
): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];
  const { maxConcurrentChecks, connectionTimeout } = monitorState.config;

  // Process URLs in batches to respect concurrency limits
  for (let i = 0; i < urls.length; i += maxConcurrentChecks) {
    const batch = urls.slice(i, i + maxConcurrentChecks);

    const batchPromises = batch.map(async (urlInfo) => {
      // Skip if already being checked
      if (monitorState.activeChecks.has(urlInfo.url)) {
        logger.info(`Skipping ${urlInfo.url} - already being checked`);
        return null;
      }

      monitorState.activeChecks.add(urlInfo.url);

      try {
        const startTime = Date.now();
        const testResult = await testStreamConnection(urlInfo.url);
        const responseTime = Date.now() - startTime;

        const healthResult: HealthCheckResult = {
          url: urlInfo.url,
          timestamp: new Date(),
          responseTime,
          isFallback: urlInfo.isFallback,
          priority: urlInfo.priority,
          source: urlInfo.source,
          status: testResult.isValid ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
          statusCode: testResult.statusCode,
          error: testResult.error
        };

        // Add to check history
        addToCheckHistory(healthResult);

        return healthResult;

      } catch (error) {
        const healthResult: HealthCheckResult = {
          url: urlInfo.url,
          timestamp: new Date(),
          isFallback: urlInfo.isFallback,
          priority: urlInfo.priority,
          source: urlInfo.source,
          status: HealthStatus.UNHEALTHY,
          error: error instanceof Error ? error.message : 'Unknown error'
        };

        addToCheckHistory(healthResult);
        return healthResult;

      } finally {
        monitorState.activeChecks.delete(urlInfo.url);
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter((result): result is HealthCheckResult => result !== null));
  }

  return results;
}

/**
 * Analyze overall system health based on individual URL results
 */
function analyzeOverallHealth(results: HealthCheckResult[]): HealthStatus {
  if (results.length === 0) {
    return HealthStatus.CRITICAL;
  }

  const healthyUrls = results.filter(r => r.status === HealthStatus.HEALTHY);
  const primaryUrls = results.filter(r => !r.isFallback);
  const fallbackUrls = results.filter(r => r.isFallback);

  // If primary URL is healthy, system is healthy
  if (primaryUrls.length > 0 && primaryUrls.some(url => url.status === HealthStatus.HEALTHY)) {
    return HealthStatus.HEALTHY;
  }

  // If any fallback is healthy, system is degraded
  if (fallbackUrls.some(url => url.status === HealthStatus.HEALTHY)) {
    return HealthStatus.DEGRADED;
  }

  // If some URLs are working but not primary, system is unhealthy
  if (healthyUrls.length > 0) {
    return HealthStatus.UNHEALTHY;
  }

  // No working URLs - critical
  return HealthStatus.CRITICAL;
}

/**
 * Check conditions for automatic failover
 */
async function checkAutoFailoverConditions(results: HealthCheckResult[]): Promise<void> {
  const primaryUrls = results.filter(r => !r.isFallback);
  const primaryHealthy = primaryUrls.some(url => url.status === HealthStatus.HEALTHY);

  // If primary is unhealthy and we haven't failed over recently
  if (!primaryHealthy && shouldAttemptFailover()) {
    const primaryUrl = primaryUrls[0]?.url;
    if (primaryUrl) {
      logger.warning(`Primary URL ${primaryUrl} is unhealthy, attempting failover`);
      await attemptAutomaticFailover(primaryUrl);
    }
  }
}

/**
 * Check if we should attempt failover based on cooldown and thresholds
 */
function shouldAttemptFailover(): boolean {
  const { failoverCooldown, failureThreshold } = monitorState.config;
  const { lastFailover, consecutiveFailures } = monitorState.currentStatus;

  // Check failure threshold
  if (consecutiveFailures < failureThreshold) {
    return false;
  }

  // Check cooldown period
  if (lastFailover) {
    const timeSinceLastFailover = Date.now() - lastFailover.getTime();
    if (timeSinceLastFailover < failoverCooldown) {
      return false;
    }
  }

  return true;
}

/**
 * Attempt automatic failover to backup URLs
 */
async function attemptAutomaticFailover(failedUrl: string): Promise<void> {
  try {
    logger.info(`Attempting automatic failover from ${failedUrl}`);

    const nextUrl = await rotateToNextFallback(failedUrl, {
      testTimeout: monitorState.config.connectionTimeout,
      enableCaching: true
    });

    if (nextUrl) {
      monitorState.currentStatus.lastFailover = new Date();
      monitorState.currentStatus.totalFailovers += 1;
      monitorState.currentStatus.lastWorkingUrl = nextUrl;

      logger.info(`Automatic failover successful: ${nextUrl}`);

      // Broadcast failover event
      if (monitorState.config.enableEventBroadcasting) {
        broadcastConfigurationReload('error_recovery', 'high', {
          source: 'health-monitor',
          debug: monitorState.config.enableDetailedLogging
        });
      }

    } else {
      logger.error('Automatic failover failed: no working backup URLs available');

      // Broadcast critical health event
      if (monitorState.config.enableEventBroadcasting) {
        broadcastHealthEvent('failover_failed', 'high');
      }
    }

  } catch (error) {
    logger.error(`Automatic failover attempt failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

    const radioError = RadioErrorHandler.createError(RadioErrorType.NETWORK_CONNECTION_FAILED, 'Automatic failover failed', { error, metadata: { failedUrl } });
    logger.error(`Automatic failover failed: ${radioError.technicalMessage}`);
  }
}

/**
 * Update system health status with new results
 */
function updateHealthStatus(
  results: HealthCheckResult[],
  overallStatus: HealthStatus,
  errorMessage?: string
): SystemHealthStatus {
  const previousStatus = monitorState.currentStatus.overallStatus;

  // Update consecutive counters based on overall status
  if (overallStatus === HealthStatus.HEALTHY) {
    monitorState.currentStatus.consecutiveSuccesses += 1;
    monitorState.currentStatus.consecutiveFailures = 0;
  } else {
    monitorState.currentStatus.consecutiveFailures += 1;
    monitorState.currentStatus.consecutiveSuccesses = 0;
  }

  // Find primary and active fallback URLs
  const primaryUrl = results.find(r => !r.isFallback);
  const activeFallback = results.find(r => r.isFallback && r.status === HealthStatus.HEALTHY);

  // Update statistics
  updateHealthStatistics(results);

  // Create new status object
  const newStatus: SystemHealthStatus = {
    ...monitorState.currentStatus,
    overallStatus,
    timestamp: new Date(),
    primaryUrl,
    activeFallback,
    availableUrls: results,
    recommendations: []
  };

  // Log status changes
  if (previousStatus !== overallStatus) {
    logger.info(`Health status changed: ${previousStatus} → ${overallStatus}`);

    if (monitorState.config.enableEventBroadcasting) {
      broadcastHealthEvent('status_changed', overallStatus === HealthStatus.CRITICAL ? 'high' : 'normal');
    }
  }

  monitorState.currentStatus = newStatus;
  return newStatus;
}

/**
 * Update health statistics based on check results
 */
function updateHealthStatistics(results: HealthCheckResult[]): void {
  const stats = monitorState.currentStatus.statistics;

  stats.totalChecks += results.length;

  const successfulResults = results.filter(r => r.status === HealthStatus.HEALTHY);
  stats.successfulChecks += successfulResults.length;
  stats.failedChecks += (results.length - successfulResults.length);

  // Calculate average response time
  const validResponseTimes = results.filter(r => r.responseTime).map(r => r.responseTime!);
  if (validResponseTimes.length > 0) {
    const totalResponseTime = validResponseTimes.reduce((sum, time) => sum + time, 0);
    stats.averageResponseTime = Math.round(totalResponseTime / validResponseTimes.length);
  }

  // Calculate uptime percentage
  if (stats.totalChecks > 0) {
    stats.uptimePercentage = Math.round((stats.successfulChecks / stats.totalChecks) * 100);
  }
}

/**
 * Add health check result to history with size management
 */
function addToCheckHistory(result: HealthCheckResult): void {
  monitorState.checkHistory.push(result);

  // Maintain history size limit
  if (monitorState.checkHistory.length > monitorState.maxHistorySize) {
    monitorState.checkHistory = monitorState.checkHistory.slice(-monitorState.maxHistorySize);
  }
}

/**
 * Generate health recommendations based on current status
 */
function generateHealthRecommendations(status: SystemHealthStatus): string[] {
  const recommendations: string[] = [];

  if (status.overallStatus === HealthStatus.CRITICAL) {
    recommendations.push('All stream URLs are failing - check network connectivity and server status');
    recommendations.push('Verify stream server configurations and restart if necessary');
  }

  if (status.overallStatus === HealthStatus.UNHEALTHY) {
    recommendations.push('Primary stream URL is failing - investigate server issues');
    recommendations.push('Consider updating primary stream URL if problem persists');
  }

  if (status.overallStatus === HealthStatus.DEGRADED) {
    recommendations.push('System is running on fallback URLs - restore primary stream when possible');
  }

  if (status.consecutiveFailures > 10) {
    recommendations.push('High number of consecutive failures detected - review stream infrastructure');
  }

  if (status.statistics.averageResponseTime > 5000) {
    recommendations.push('High response times detected - check network latency and server performance');
  }

  if (status.statistics.uptimePercentage < 95) {
    recommendations.push('Low uptime percentage - consider adding more reliable backup URLs');
  }

  if (status.totalFailovers > 5) {
    recommendations.push('Multiple failovers detected - investigate stability of primary stream URL');
  }

  return recommendations;
}

/**
 * Log detailed health check results
 */
function logHealthCheckResults(status: SystemHealthStatus, checkDuration: number): void {
  logger.info(`Health check completed in ${checkDuration}ms - Status: ${status.overallStatus}`);

  if (status.primaryUrl) {
    logger.info(`Primary URL: ${status.primaryUrl.url} - ${status.primaryUrl.status} (${status.primaryUrl.responseTime}ms)`);
  }

  if (status.activeFallback) {
    logger.info(`Active fallback: ${status.activeFallback.url} - ${status.activeFallback.status} (${status.activeFallback.responseTime}ms)`);
  }

  logger.info(`Statistics: ${status.statistics.uptimePercentage}% uptime, ${status.statistics.averageResponseTime}ms avg response`);

  if (status.recommendations.length > 0) {
    logger.warning(`Recommendations: ${status.recommendations.join('; ')}`);
  }
}

/**
 * Broadcast health-related events
 */
function broadcastHealthEvent(reason: string, priority: 'high' | 'normal' | 'low'): void {
  const eventPayload: RadioConfigurationReloadEvent = {
    reason: 'error_recovery',
    priority,
    timestamp: Date.now(),
    source: 'health-monitor',
    correlationId: `health-${Date.now()}`
  };

  safeBroadcastEvent(RADIO_EVENT_NAMES.CONFIGURATION_RELOAD_REQUIRED, eventPayload, {
    source: 'health-monitor',
    debug: monitorState.config.enableDetailedLogging
  });
}

/**
 * Broadcast health status updates
 */
function broadcastHealthStatusUpdate(status: SystemHealthStatus): void {
  // Create custom health status event
  const healthEvent = new CustomEvent('radioHealthStatusUpdate', {
    detail: {
      status: status.overallStatus,
      timestamp: status.timestamp.getTime(),
      source: 'health-monitor',
      primaryUrl: status.primaryUrl?.url,
      activeFallback: status.activeFallback?.url,
      statistics: status.statistics,
      recommendations: status.recommendations
    },
    bubbles: false,
    cancelable: false
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(healthEvent);
  }
}

/**
 * Get current health status
 */
export function getHealthStatus(): SystemHealthStatus {
  return { ...monitorState.currentStatus };
}

/**
 * Get health monitoring configuration
 */
export function getHealthConfig(): Required<HealthMonitorConfig> {
  return { ...monitorState.config };
}

/**
 * Update health monitoring configuration
 */
export function updateHealthConfig(newConfig: Partial<HealthMonitorConfig>): void {
  monitorState.config = { ...monitorState.config, ...newConfig };
  logger.info('Health monitoring configuration updated');
}

/**
 * Get health check history
 */
export function getHealthHistory(limit?: number): HealthCheckResult[] {
  const history = [...monitorState.checkHistory];
  return limit ? history.slice(-limit) : history;
}

/**
 * Clear health check history
 */
export function clearHealthHistory(): void {
  monitorState.checkHistory = [];
  logger.info('Health check history cleared');
}

/**
 * Get monitoring status
 */
export function isMonitoringActive(): boolean {
  return monitorState.isActive;
}

/**
 * Force immediate health check
 */
export async function forceHealthCheck(): Promise<SystemHealthStatus> {
  logger.info('Forcing immediate health check');
  return await performHealthCheck();
}

/**
 * Get comprehensive health report for admin dashboard
 */
export async function getHealthReport(): Promise<{
  status: SystemHealthStatus;
  isActive: boolean;
  config: Required<HealthMonitorConfig>;
  recentHistory: HealthCheckResult[];
  recommendations: string[];
}> {
  return {
    status: getHealthStatus(),
    isActive: isMonitoringActive(),
    config: getHealthConfig(),
    recentHistory: getHealthHistory(50), // Last 50 checks
    recommendations: monitorState.currentStatus.recommendations
  };
}

/**
 * Reset health monitoring state
 */
export function resetHealthState(): void {
  if (monitorState.isActive) {
    stopHealthMonitoring();
  }

  monitorState = {
    isActive: false,
    currentStatus: {
      overallStatus: HealthStatus.UNKNOWN,
      timestamp: new Date(),
      availableUrls: [],
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      totalFailovers: 0,
      statistics: {
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        averageResponseTime: 0,
        uptimePercentage: 0
      },
      recommendations: []
    },
    config: DEFAULT_HEALTH_CONFIG,
    activeChecks: new Set(),
    checkHistory: [],
    maxHistorySize: 1000
  };

  logger.info('Health monitoring state reset');
}

/**
 * Default export with commonly used functions
 */
const radioHealthMonitor = {
  // Core functions
  start: startHealthMonitoring,
  stop: stopHealthMonitoring,
  check: performHealthCheck,
  forceCheck: forceHealthCheck,

  // Status and configuration
  getStatus: getHealthStatus,
  getConfig: getHealthConfig,
  updateConfig: updateHealthConfig,
  isActive: isMonitoringActive,

  // History and reporting
  getHistory: getHealthHistory,
  clearHistory: clearHealthHistory,
  getReport: getHealthReport,

  // Utilities
  reset: resetHealthState,

  // Constants
  HealthStatus
};

export default radioHealthMonitor;