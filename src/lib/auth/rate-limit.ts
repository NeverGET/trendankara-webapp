/**
 * Rate limiting for login attempts
 * SIMPLE in-memory implementation to prevent brute force attacks
 */

// Configuration constants
const MAX_FAILED_ATTEMPTS = 5; // Maximum failed attempts before blocking
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes in milliseconds
const CLEANUP_INTERVAL_MS = 60 * 1000; // Cleanup interval: 1 minute

// Interface for tracking login attempts
interface LoginAttempt {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}

// In-memory storage for login attempts by IP address
const loginAttempts = new Map<string, LoginAttempt>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, attempt] of loginAttempts.entries()) {
    // Remove entries that are no longer blocked and haven't been used recently
    if (attempt.blockedUntil && attempt.blockedUntil < now) {
      // If block has expired and no recent activity, clean up
      if (now - attempt.lastAttempt > BLOCK_DURATION_MS) {
        loginAttempts.delete(ip);
      } else {
        // Just remove the block, reset count
        attempt.count = 0;
        delete attempt.blockedUntil;
      }
    }
  }
}, CLEANUP_INTERVAL_MS);

/**
 * Check if an IP address is currently rate limited
 * @param ip - The IP address to check
 * @returns Object with isBlocked status and remaining time
 */
export function isRateLimited(ip: string): {
  isBlocked: boolean;
  remainingTime?: number;
  message?: string;
} {
  if (!ip) {
    return { isBlocked: false };
  }

  const attempt = loginAttempts.get(ip);
  if (!attempt) {
    return { isBlocked: false };
  }

  const now = Date.now();

  // Check if currently blocked
  if (attempt.blockedUntil && attempt.blockedUntil > now) {
    const remainingTime = Math.ceil((attempt.blockedUntil - now) / 1000 / 60); // in minutes
    return {
      isBlocked: true,
      remainingTime,
      message: `Çok fazla başarısız giriş denemesi. ${remainingTime} dakika sonra tekrar deneyin.` // Turkish: Too many failed login attempts. Try again in X minutes.
    };
  }

  // Block has expired, clean up
  if (attempt.blockedUntil && attempt.blockedUntil <= now) {
    attempt.count = 0;
    delete attempt.blockedUntil;
  }

  return { isBlocked: false };
}

/**
 * Record a failed login attempt for an IP address
 * @param ip - The IP address that had a failed login attempt
 * @returns Object with block status and message
 */
export function recordFailedAttempt(ip: string): {
  isBlocked: boolean;
  remainingAttempts?: number;
  message?: string;
} {
  if (!ip) {
    return { isBlocked: false };
  }

  const now = Date.now();
  let attempt = loginAttempts.get(ip);

  if (!attempt) {
    attempt = {
      count: 1,
      lastAttempt: now
    };
    loginAttempts.set(ip, attempt);
  } else {
    attempt.count++;
    attempt.lastAttempt = now;
  }

  // Check if we should block this IP
  if (attempt.count >= MAX_FAILED_ATTEMPTS) {
    attempt.blockedUntil = now + BLOCK_DURATION_MS;
    const blockDurationMinutes = Math.ceil(BLOCK_DURATION_MS / 1000 / 60);

    return {
      isBlocked: true,
      message: `Çok fazla başarısız giriş denemesi. ${blockDurationMinutes} dakika boyunca engellendiniz.` // Turkish: Too many failed login attempts. You are blocked for X minutes.
    };
  }

  const remainingAttempts = MAX_FAILED_ATTEMPTS - attempt.count;
  return {
    isBlocked: false,
    remainingAttempts,
    message: `Geçersiz şifre. ${remainingAttempts} deneme hakkınız kaldı.` // Turkish: Invalid password. You have X attempts remaining.
  };
}

/**
 * Reset failed attempts for an IP address (call on successful login)
 * @param ip - The IP address to reset
 */
export function resetFailedAttempts(ip: string): void {
  if (!ip) {
    return;
  }

  loginAttempts.delete(ip);
}

/**
 * Get current statistics for monitoring purposes
 * @returns Object with current rate limiting statistics
 */
export function getRateLimitStats(): {
  totalTrackedIPs: number;
  blockedIPs: number;
  activeAttempts: number;
} {
  const now = Date.now();
  let blockedIPs = 0;
  let activeAttempts = 0;

  for (const attempt of loginAttempts.values()) {
    if (attempt.blockedUntil && attempt.blockedUntil > now) {
      blockedIPs++;
    }
    if (attempt.count > 0) {
      activeAttempts++;
    }
  }

  return {
    totalTrackedIPs: loginAttempts.size,
    blockedIPs,
    activeAttempts
  };
}

/**
 * Extract IP address from request headers (consistent across the app)
 * @param headers - Request headers object
 * @returns The client's IP address
 */
export function getClientIP(headers: Headers | Record<string, string | string[] | undefined>): string {
  // Handle both Headers object and plain object
  const getHeader = (name: string): string | undefined => {
    if (headers instanceof Headers) {
      return headers.get(name) || undefined;
    } else {
      const value = headers[name];
      return Array.isArray(value) ? value[0] : value;
    }
  };

  const forwardedFor = getHeader('x-forwarded-for');
  const realIp = getHeader('x-real-ip');
  const remoteAddr = getHeader('remote-addr');

  // Return the first available IP
  return forwardedFor || realIp || remoteAddr || 'unknown';
}

/**
 * Get rate limit info for a specific IP (for monitoring/debugging)
 * @param ip - The IP address to check
 * @returns Current rate limit info for the IP
 */
export function getIPRateLimitInfo(ip: string): {
  hasAttempts: boolean;
  attemptCount: number;
  isBlocked: boolean;
  blockedUntil?: number;
  lastAttempt?: number;
} {
  const attempt = loginAttempts.get(ip);

  if (!attempt) {
    return {
      hasAttempts: false,
      attemptCount: 0,
      isBlocked: false
    };
  }

  const now = Date.now();
  const isCurrentlyBlocked = attempt.blockedUntil ? attempt.blockedUntil > now : false;

  return {
    hasAttempts: true,
    attemptCount: attempt.count,
    isBlocked: isCurrentlyBlocked,
    blockedUntil: attempt.blockedUntil,
    lastAttempt: attempt.lastAttempt
  };
}

/**
 * Clear all rate limiting data (use with caution, mainly for testing)
 */
export function clearAllRateLimits(): void {
  loginAttempts.clear();
}