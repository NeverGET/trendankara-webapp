/**
 * Logger utility for development feedback
 * Provides colored terminal output for better visibility during development
 */

type LogLevel = 'success' | 'error' | 'warning' | 'info';

interface LogOptions {
  prefix?: string;
  showTimestamp?: boolean;
}

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
} as const;

/**
 * Icons for different log levels
 */
const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
} as const;

/**
 * Color mapping for log levels
 */
const levelColors = {
  success: colors.green,
  error: colors.red,
  warning: colors.yellow,
  info: colors.blue,
} as const;

/**
 * Check if we're in development mode
 */
const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Format timestamp for logs
 */
const formatTimestamp = (): string => {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Core logging function with colored output
 */
const log = (level: LogLevel, message: string, options: LogOptions = {}): void => {
  // Only show detailed output in development mode
  if (!isDevelopment()) {
    return;
  }

  const { prefix, showTimestamp = true } = options;
  const icon = icons[level];
  const color = levelColors[level];

  let output = '';

  // Add timestamp if requested
  if (showTimestamp) {
    output += `${colors.dim}[${formatTimestamp()}]${colors.reset} `;
  }

  // Add colored icon and level
  output += `${color}${icon} ${message}${colors.reset}`;

  // Add prefix if provided
  if (prefix) {
    output += ` ${colors.dim}(${prefix})${colors.reset}`;
  }

  console.log(output);
};

/**
 * Log success message with green color
 * Example: "✅ MySQL connected (Docker)"
 */
export const logSuccess = (message: string, options?: LogOptions): void => {
  log('success', message, options);
};

/**
 * Log error message with red color
 * Example: "❌ Database connection failed"
 */
export const logError = (message: string, options?: LogOptions): void => {
  log('error', message, options);
};

/**
 * Log warning message with yellow color
 * Example: "⚠️ Deprecated API endpoint used"
 */
export const logWarning = (message: string, options?: LogOptions): void => {
  log('warning', message, options);
};

/**
 * Log info message with blue color
 * Example: "ℹ️ Server starting on port 3000"
 */
export const logInfo = (message: string, options?: LogOptions): void => {
  log('info', message, options);
};

/**
 * Create a prefixed logger for specific modules
 */
export const createPrefixedLogger = (prefix: string) => ({
  success: (message: string) => logSuccess(message, { prefix }),
  error: (message: string) => logError(message, { prefix }),
  warning: (message: string) => logWarning(message, { prefix }),
  info: (message: string) => logInfo(message, { prefix }),
});

/**
 * Log database connection success with appropriate context
 */
export const logDatabaseConnection = (type: 'Docker' | 'Local'): void => {
  logSuccess(`MySQL connected (${type})`);
};

/**
 * Log storage connection success
 */
export const logStorageConnection = (): void => {
  logSuccess('MinIO connected');
};

/**
 * Default export for convenience
 */
export default {
  success: logSuccess,
  error: logError,
  warning: logWarning,
  info: logInfo,
  createPrefixed: createPrefixedLogger,
  database: logDatabaseConnection,
  storage: logStorageConnection,
};