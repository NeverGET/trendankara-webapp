/**
 * Mobile Cache Manager
 * Provides memory caching with TTL and ETag support for mobile API endpoints
 * Requirements: 1.7, NFR-Performance - Sub-200ms response times with caching
 */

import { createHash } from 'crypto';
import type { CacheEntry } from '@/types/mobile';

/**
 * In-memory cache store
 * Key-value store with cache entries containing data, etag, and expiration
 */
class MobileCacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.cache = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  /**
   * Get cached data by key
   * Returns null if not found or expired
   *
   * @param key Cache key to retrieve
   * @returns Cache entry or null if not found/expired
   */
  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry as CacheEntry<T>;
  }

  /**
   * Set cache data with TTL
   *
   * @param key Cache key
   * @param value Data to cache
   * @param ttl Time to live in seconds
   * @returns The created cache entry
   */
  set<T>(key: string, value: T, ttl: number): CacheEntry<T> {
    const now = Date.now();
    const etag = this.generateETag(value);

    const entry: CacheEntry<T> = {
      data: value,
      etag,
      expires: now + (ttl * 1000),
      created: now
    };

    this.cache.set(key, entry);
    return entry;
  }

  /**
   * Generate ETag for data
   * Creates a hash of the JSON stringified data
   *
   * @param data Data to generate ETag for
   * @returns ETag string
   */
  generateETag(data: any): string {
    const hash = createHash('md5');
    hash.update(JSON.stringify(data));
    return `"${hash.digest('hex')}"`;
  }

  /**
   * Invalidate cache entries matching a pattern
   * Supports wildcard patterns like "polls:*"
   *
   * @param pattern Pattern to match cache keys
   */
  invalidate(pattern: string): void {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * Returns current cache size and memory usage estimate
   */
  getStats(): { size: number; keys: string[]; memoryEstimate: number } {
    const keys = Array.from(this.cache.keys());

    // Rough memory estimate (not exact but useful for monitoring)
    let memoryEstimate = 0;
    for (const entry of this.cache.values()) {
      memoryEstimate += JSON.stringify(entry).length * 2; // Approximate bytes (UTF-16)
    }

    return {
      size: this.cache.size,
      keys,
      memoryEstimate
    };
  }

  /**
   * Check if a key exists and is not expired
   *
   * @param key Cache key to check
   * @returns True if exists and not expired
   */
  has(key: string): boolean {
    const entry = this.get(key);
    return entry !== null;
  }

  /**
   * Get remaining TTL for a cache entry
   *
   * @param key Cache key
   * @returns Remaining TTL in seconds or null if not found
   */
  getTTL(key: string): number | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const remaining = entry.expires - Date.now();
    return remaining > 0 ? Math.floor(remaining / 1000) : null;
  }

  /**
   * Start periodic cleanup of expired entries
   * Runs every 60 seconds to remove expired items
   */
  private startCleanup(): void {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expires) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Every 60 seconds
  }

  /**
   * Stop the cleanup interval
   * Call this when shutting down the application
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }

  /**
   * Create a cache key from multiple parts
   * Helper method to create consistent cache keys
   *
   * @param parts Parts of the cache key
   * @returns Formatted cache key
   */
  static createKey(...parts: (string | number)[]): string {
    return parts.join(':');
  }

  /**
   * Check if a request has a matching ETag
   * Used for conditional requests (304 Not Modified)
   *
   * @param requestETag ETag from request headers
   * @param dataETag Current data ETag
   * @returns True if ETags match
   */
  static isETagMatch(requestETag: string | null, dataETag: string): boolean {
    if (!requestETag) return false;

    // Remove quotes and weak indicator for comparison
    const normalize = (etag: string) => etag.replace(/^W\//, '').replace(/"/g, '');
    return normalize(requestETag) === normalize(dataETag);
  }
}

// Export singleton instance
const cacheManager = new MobileCacheManager();

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => {
    cacheManager.destroy();
  });

  process.on('SIGTERM', () => {
    cacheManager.destroy();
  });
}

export default cacheManager;
export { MobileCacheManager };