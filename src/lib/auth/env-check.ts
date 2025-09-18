/**
 * Authentication Environment Variable Validation
 * Validates required auth environment variables and provides helpful error messages
 */

interface AuthEnvConfig {
  NEXTAUTH_URL?: string;
  NEXTAUTH_SECRET?: string;
  AUTH_SECRET?: string;
  NODE_ENV?: string;
}

/**
 * Validates required authentication environment variables
 * Throws errors if missing in production with helpful error messages
 */
export function validateAuthEnvironment(): void {
  const env: AuthEnvConfig = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  };

  const errors: string[] = [];
  const isProduction = env.NODE_ENV === 'production';

  // Validate NEXTAUTH_URL
  if (!env.NEXTAUTH_URL) {
    errors.push(
      `NEXTAUTH_URL is required for NextAuth.js configuration.
      Please set NEXTAUTH_URL in your environment variables.
      Example: NEXTAUTH_URL=https://yourdomain.com`
    );
  } else {
    // Basic URL validation
    try {
      new URL(env.NEXTAUTH_URL);
    } catch {
      errors.push(
        `NEXTAUTH_URL must be a valid URL.
        Current value: ${env.NEXTAUTH_URL}
        Example: NEXTAUTH_URL=https://yourdomain.com`
      );
    }
  }

  // Validate AUTH_SECRET or NEXTAUTH_SECRET (either one is acceptable)
  const hasAuthSecret = env.AUTH_SECRET || env.NEXTAUTH_SECRET;
  if (!hasAuthSecret) {
    errors.push(
      `Authentication secret is required for JWT strategy.
      Please set either AUTH_SECRET or NEXTAUTH_SECRET in your environment variables.
      The secret should be at least 32 characters long for security.
      Example: AUTH_SECRET=your-secure-secret-key-minimum-32-characters-long`
    );
  } else {
    // Validate secret length in production
    const secret = env.AUTH_SECRET || env.NEXTAUTH_SECRET;
    if (isProduction && secret && secret.length < 32) {
      errors.push(
        `Authentication secret must be at least 32 characters long in production.
        Current length: ${secret.length} characters.
        Please use a longer, more secure secret.`
      );
    }
  }

  // Throw error if any validation failed
  if (errors.length > 0) {
    const errorMessage = [
      '❌ Authentication Environment Configuration Error',
      '',
      'The following authentication environment variables are missing or invalid:',
      '',
      ...errors.map(error => `• ${error.trim()}`),
      '',
      'Please check your .env.local file or environment configuration.',
      'Refer to .env.example for proper configuration examples.',
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Log successful validation in development
  if (!isProduction) {
    console.log('✅ Authentication environment variables validated successfully');
  }
}

/**
 * Gets the current authentication secret
 * Prioritizes AUTH_SECRET over NEXTAUTH_SECRET
 */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error(
      'Authentication secret not found. Please set AUTH_SECRET or NEXTAUTH_SECRET environment variable.'
    );
  }

  return secret;
}

/**
 * Gets the NextAuth URL with fallback validation
 */
export function getNextAuthUrl(): string {
  const url = process.env.NEXTAUTH_URL;

  if (!url) {
    throw new Error(
      'NEXTAUTH_URL is required. Please set NEXTAUTH_URL environment variable.'
    );
  }

  return url;
}