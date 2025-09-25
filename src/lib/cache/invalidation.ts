import { unstable_cache, revalidateTag } from 'next/cache';

export type CacheEntity = 'news' | 'polls' | 'radio' | 'media';

/**
 * Cache tag constants for different entity types
 */
export const CACHE_TAGS = {
  NEWS: 'news',
  NEWS_ITEM: (id: string) => `news-${id}`,
  NEWS_LIST: 'news-list',
  POLLS: 'polls',
  POLLS_ITEM: (id: string) => `polls-${id}`,
  POLLS_ACTIVE: 'polls-active',
  RADIO_CONFIG: 'radio-config',
  RADIO_SETTINGS: 'radio-settings',
  MOBILE_RADIO: 'mobile-radio',
  MEDIA: 'media',
  MEDIA_ITEM: (id: string) => `media-${id}`,
} as const;

/**
 * Generate cache key for entity with timestamp
 */
export function generateCacheKey(entity: CacheEntity, id?: string): string {
  const timestamp = Date.now();
  return id ? `${entity}-${id}-${timestamp}` : `${entity}-${timestamp}`;
}

/**
 * Invalidate cache for specific entity
 */
export async function invalidateEntityCache(entity: CacheEntity, id?: string): Promise<void> {
  switch (entity) {
    case 'news':
      if (id) {
        revalidateTag(CACHE_TAGS.NEWS_ITEM(id));
      }
      revalidateTag(CACHE_TAGS.NEWS);
      revalidateTag(CACHE_TAGS.NEWS_LIST);
      break;

    case 'polls':
      if (id) {
        revalidateTag(CACHE_TAGS.POLLS_ITEM(id));
      }
      revalidateTag(CACHE_TAGS.POLLS);
      revalidateTag(CACHE_TAGS.POLLS_ACTIVE);
      break;

    case 'radio':
      revalidateTag(CACHE_TAGS.RADIO_CONFIG);
      revalidateTag(CACHE_TAGS.RADIO_SETTINGS);
      revalidateTag(CACHE_TAGS.MOBILE_RADIO);
      // Clear mobile radio memory cache
      clearMobileRadioMemoryCache();
      break;

    case 'media':
      if (id) {
        revalidateTag(CACHE_TAGS.MEDIA_ITEM(id));
      }
      revalidateTag(CACHE_TAGS.MEDIA);
      break;
  }
}

/**
 * Invalidate multiple entities at once
 */
export async function invalidateMultipleEntities(
  entities: Array<{ entity: CacheEntity; id?: string }>
): Promise<void> {
  await Promise.all(
    entities.map(({ entity, id }) => invalidateEntityCache(entity, id))
  );
}

/**
 * Invalidate all content caches
 */
export async function invalidateAllContentCache(): Promise<void> {
  await invalidateMultipleEntities([
    { entity: 'news' },
    { entity: 'polls' },
    { entity: 'radio' },
    { entity: 'media' }
  ]);
}

/**
 * Cache wrapper function with automatic invalidation
 */
export function cacheWithTag<T>(
  fn: () => Promise<T>,
  tags: string[],
  options?: {
    revalidate?: number;
  }
): Promise<T> {
  return unstable_cache(fn, undefined, {
    tags,
    revalidate: options?.revalidate,
  })();
}

/**
 * Clear mobile radio memory cache (for use when radio settings are updated)
 * This function is imported by the mobile radio API to clear its memory cache
 */
export function clearMobileRadioMemoryCache(): void {
  try {
    // Access the mobile radio cache if available
    const { clearMobileRadioCache } = require('@/app/api/mobile/v1/radio/route');
    if (typeof clearMobileRadioCache === 'function') {
      clearMobileRadioCache();
    }
  } catch (error) {
    // Silently ignore if the mobile radio route is not available
    console.debug('Could not clear mobile radio memory cache:', error);
  }
}