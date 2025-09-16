import type { DatabaseConfig } from '@/types/database';
import type { StorageConfig } from '@/types/storage';

/**
 * Complete application configuration interface
 */
export interface AppConfig {
  database: DatabaseConfig;
  storage: StorageConfig;
  auth: {
    nextAuthUrl: string;
    nextAuthSecret: string;
  };
  radio: {
    streamUrl: string;
    metadataUrl: string;
    corsProxy: string;
  };
  mobile: {
    apiVersion: string;
    apiKey: string;
    rateLimit: number;
  };
  site: {
    name: string;
    url: string;
    description: string;
  };
  environment: {
    nodeEnv: 'development' | 'production' | 'test';
    debug: boolean;
    isDocker: boolean;
  };
}

/**
 * Environment validation error
 */
export class EnvironmentValidationError extends Error {
  constructor(
    message: string,
    public missingVariables: string[] = [],
    public invalidVariables: string[] = []
  ) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

/**
 * Validate a required environment variable
 */
function validateRequired(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

/**
 * Validate an optional environment variable with default
 */
function validateOptional(value: string | undefined, defaultValue: string): string {
  return value && value.trim() !== '' ? value.trim() : defaultValue;
}

/**
 * Validate and parse a numeric environment variable
 */
function validateNumber(
  name: string,
  value: string | undefined,
  defaultValue: number,
  min?: number,
  max?: number
): number {
  const stringValue = validateOptional(value, defaultValue.toString());
  const numValue = parseInt(stringValue, 10);

  if (isNaN(numValue)) {
    throw new Error(`Invalid numeric value for ${name}: ${stringValue}`);
  }

  if (min !== undefined && numValue < min) {
    throw new Error(`${name} must be at least ${min}, got ${numValue}`);
  }

  if (max !== undefined && numValue > max) {
    throw new Error(`${name} must be at most ${max}, got ${numValue}`);
  }

  return numValue;
}

/**
 * Validate and parse a boolean environment variable
 */
function validateBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value || value.trim() === '') {
    return defaultValue;
  }

  const lowerValue = value.toLowerCase().trim();
  if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
    return true;
  }
  if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') {
    return false;
  }

  return defaultValue;
}

/**
 * Parse DATABASE_URL into individual components
 */
function parseDatabaseUrl(databaseUrl: string): {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
} {
  try {
    // Format: mysql://user:password@host:port/database
    const url = new URL(databaseUrl);

    if (url.protocol !== 'mysql:') {
      throw new Error('DATABASE_URL must use mysql:// protocol');
    }

    const host = url.hostname;
    const port = url.port ? parseInt(url.port, 10) : 3306;
    const user = url.username;
    const password = url.password;
    const database = url.pathname.slice(1); // Remove leading /

    if (!host || !user || !password || !database) {
      throw new Error('DATABASE_URL missing required components (host, user, password, database)');
    }

    return { host, port, user, password, database };
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Detect if running in Docker environment
 */
function detectDockerEnvironment(): boolean {
  // Check for Docker-specific environment indicators
  const isDocker =
    process.env.DOCKER_CONTAINER === 'true' ||
    process.env.CONTAINER === 'docker' ||
    // Check if running inside a container (common Docker detection)
    (typeof process !== 'undefined' &&
     process.platform === 'linux' &&
     process.env.NODE_ENV === 'production' &&
     process.env.HOSTNAME?.startsWith('webapp-')) ||
    // Check for Docker Compose service names in environment
    Boolean(process.env.DATABASE_HOST === 'radiodb' ||
            process.env.MINIO_ENDPOINT === 'minio');

  return isDocker;
}

/**
 * Validate and return complete application configuration
 *
 * @returns Typed configuration object with all required settings
 * @throws EnvironmentValidationError if required variables are missing or invalid
 */
export function validateEnv(): AppConfig {
  const errors: string[] = [];
  const missingVariables: string[] = [];
  const invalidVariables: string[] = [];

  try {
    // Detect environment
    const isDocker = detectDockerEnvironment();
    const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';

    // Validate database configuration
    let databaseConfig: DatabaseConfig;
    try {
      const databaseUrl = validateRequired('DATABASE_URL', process.env.DATABASE_URL);
      const dbComponents = parseDatabaseUrl(databaseUrl);

      databaseConfig = {
        host: dbComponents.host,
        port: dbComponents.port,
        user: dbComponents.user,
        password: dbComponents.password,
        database: dbComponents.database,
        connectionLimit: validateNumber('DATABASE_CONNECTION_LIMIT', process.env.DATABASE_CONNECTION_LIMIT, 10, 5, 20),
        waitForConnections: true,
        queueLimit: 0,
        acquireTimeout: validateNumber('DATABASE_TIMEOUT', process.env.DATABASE_TIMEOUT, 60000, 10000, 300000),
        timeout: validateNumber('DATABASE_TIMEOUT', process.env.DATABASE_TIMEOUT, 60000, 10000, 300000),
        enableKeepAlive: true,
        keepAliveInitialDelay: 30000,
      };
    } catch (error) {
      errors.push(`Database configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.message.includes('Missing required')) {
        missingVariables.push('DATABASE_URL');
      } else {
        invalidVariables.push('DATABASE_URL');
      }
      // Provide fallback config to continue validation
      databaseConfig = {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'radio_db',
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 0,
        acquireTimeout: 60000,
        timeout: 60000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 30000,
      };
    }

    // Validate storage configuration
    let storageConfig: StorageConfig;
    try {
      storageConfig = {
        endpoint: validateRequired('MINIO_ENDPOINT', process.env.MINIO_ENDPOINT),
        port: validateNumber('MINIO_PORT', process.env.MINIO_PORT, 9000, 1, 65535),
        accessKey: validateRequired('MINIO_ACCESS_KEY', process.env.MINIO_ACCESS_KEY),
        secretKey: validateRequired('MINIO_SECRET_KEY', process.env.MINIO_SECRET_KEY),
        bucket: validateOptional(process.env.MINIO_BUCKET, 'media'),
        useSSL: validateBoolean(process.env.MINIO_USE_SSL, false),
        region: validateOptional(process.env.MINIO_REGION, 'us-east-1'),
      };
    } catch (error) {
      errors.push(`Storage configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.message.includes('Missing required')) {
        const match = error.message.match(/Missing required environment variable: (\w+)/);
        if (match) missingVariables.push(match[1]);
      }
      // Provide fallback config
      storageConfig = {
        endpoint: 'localhost',
        port: 9000,
        accessKey: 'minioadmin',
        secretKey: 'minioadmin123',
        bucket: 'media',
        useSSL: false,
        region: 'us-east-1',
      };
    }

    // Validate authentication configuration
    let authConfig: AppConfig['auth'];
    try {
      authConfig = {
        nextAuthUrl: validateRequired('NEXTAUTH_URL', process.env.NEXTAUTH_URL),
        nextAuthSecret: validateRequired('NEXTAUTH_SECRET', process.env.NEXTAUTH_SECRET),
      };
    } catch (error) {
      errors.push(`Authentication configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.message.includes('Missing required')) {
        const match = error.message.match(/Missing required environment variable: (\w+)/);
        if (match) missingVariables.push(match[1]);
      }
      authConfig = {
        nextAuthUrl: 'http://localhost:3000',
        nextAuthSecret: 'dev-secret-change-in-production',
      };
    }

    // Validate radio configuration
    let radioConfig: AppConfig['radio'];
    try {
      radioConfig = {
        streamUrl: validateRequired('RADIO_STREAM_URL', process.env.RADIO_STREAM_URL),
        metadataUrl: validateRequired('RADIO_METADATA_URL', process.env.RADIO_METADATA_URL),
        corsProxy: validateRequired('RADIO_CORS_PROXY', process.env.RADIO_CORS_PROXY),
      };
    } catch (error) {
      errors.push(`Radio configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.message.includes('Missing required')) {
        const match = error.message.match(/Missing required environment variable: (\w+)/);
        if (match) missingVariables.push(match[1]);
      }
      radioConfig = {
        streamUrl: 'https://example.com/stream',
        metadataUrl: 'https://example.com/metadata',
        corsProxy: 'https://example.com/cors',
      };
    }

    // Validate mobile configuration
    const mobileConfig: AppConfig['mobile'] = {
      apiVersion: validateOptional(process.env.API_VERSION, 'v1'),
      apiKey: validateOptional(process.env.MOBILE_API_KEY, 'dev-api-key-change-in-production'),
      rateLimit: validateNumber('RATE_LIMIT_MOBILE', process.env.RATE_LIMIT_MOBILE, 100, 1, 10000),
    };

    // Validate site configuration
    const siteConfig: AppConfig['site'] = {
      name: validateOptional(process.env.SITE_NAME, 'Trend Ankara Radio'),
      url: validateOptional(process.env.SITE_URL, isDocker ? 'http://webapp:3000' : 'http://localhost:3000'),
      description: validateOptional(process.env.SITE_DESCRIPTION, 'Professional Turkish Radio Station'),
    };

    // Environment configuration
    const environmentConfig: AppConfig['environment'] = {
      nodeEnv,
      debug: validateBoolean(process.env.DEBUG, nodeEnv === 'development'),
      isDocker,
    };

    // If there are validation errors, throw them
    if (errors.length > 0) {
      const errorMessage = [
        'Environment validation failed:',
        ...errors,
        '',
        'Please check your .env.local file and ensure all required variables are set.',
        '',
        'Required variables:',
        '- DATABASE_URL (format: mysql://user:password@host:port/database)',
        '- MINIO_ENDPOINT (MinIO server endpoint)',
        '- MINIO_ACCESS_KEY (MinIO access key)',
        '- MINIO_SECRET_KEY (MinIO secret key)',
        '- NEXTAUTH_URL (NextAuth URL for authentication)',
        '- NEXTAUTH_SECRET (NextAuth secret key)',
        '- RADIO_STREAM_URL (Radio stream URL)',
        '- RADIO_METADATA_URL (Radio metadata URL)',
        '- RADIO_CORS_PROXY (CORS proxy URL)',
        '',
        missingVariables.length > 0 ? `Missing variables: ${missingVariables.join(', ')}` : '',
        invalidVariables.length > 0 ? `Invalid variables: ${invalidVariables.join(', ')}` : '',
      ].filter(Boolean).join('\n');

      throw new EnvironmentValidationError(errorMessage, missingVariables, invalidVariables);
    }

    const config: AppConfig = {
      database: databaseConfig,
      storage: storageConfig,
      auth: authConfig,
      radio: radioConfig,
      mobile: mobileConfig,
      site: siteConfig,
      environment: environmentConfig,
    };

    // Log configuration summary in development
    if (nodeEnv === 'development' && environmentConfig.debug) {
      console.log('✅ Environment validation successful');
      console.log('📊 Configuration summary:');
      console.log(`   Environment: ${nodeEnv} (Docker: ${isDocker ? 'Yes' : 'No'})`);
      console.log(`   Database: ${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}`);
      console.log(`   Storage: ${storageConfig.endpoint}:${storageConfig.port}/${storageConfig.bucket}`);
      console.log(`   Site: ${siteConfig.name} (${siteConfig.url})`);
    }

    return config;

  } catch (error) {
    if (error instanceof EnvironmentValidationError) {
      throw error;
    }

    throw new EnvironmentValidationError(
      `Unexpected error during environment validation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      missingVariables,
      invalidVariables
    );
  }
}

/**
 * Get a validated configuration object
 * This is a convenience function that caches the result
 */
let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnv();
  }
  return cachedConfig;
}

/**
 * Reset the cached configuration (useful for testing)
 */
export function resetConfig(): void {
  cachedConfig = null;
}

/**
 * Validate specific environment variables for a subsystem
 */
export function validateDatabaseEnv(): DatabaseConfig {
  return validateEnv().database;
}

export function validateStorageEnv(): StorageConfig {
  return validateEnv().storage;
}

/**
 * Check if all required environment variables are present
 * without throwing errors (useful for health checks)
 */
export function checkEnvironmentHealth(): {
  isValid: boolean;
  missingVariables: string[];
  invalidVariables: string[];
  errors: string[];
} {
  try {
    validateEnv();
    return {
      isValid: true,
      missingVariables: [],
      invalidVariables: [],
      errors: [],
    };
  } catch (error) {
    if (error instanceof EnvironmentValidationError) {
      return {
        isValid: false,
        missingVariables: error.missingVariables,
        invalidVariables: error.invalidVariables,
        errors: [error.message],
      };
    }

    return {
      isValid: false,
      missingVariables: [],
      invalidVariables: [],
      errors: [error instanceof Error ? error.message : 'Unknown validation error'],
    };
  }
}