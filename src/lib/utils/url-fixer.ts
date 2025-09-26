/**
 * Utility to fix MinIO URLs for HTTPS compatibility
 * Converts external MinIO URLs to internal proxy URLs
 */

/**
 * Fix a single URL - convert MinIO URLs to proxy URLs
 */
export function fixMediaUrl(url: string | null | undefined): string | null | undefined {
  if (!url) return url;

  // Check if it's a MinIO URL that needs fixing
  if (url.includes('82.29.169.180:9002/media/')) {
    // Extract the path after /media/
    const parts = url.split('/media/');
    const key = parts[parts.length - 1];
    return `/api/media/${key}`;
  }

  // Already a proxy URL or other URL
  return url;
}

/**
 * Recursively fix all media URLs in an object
 */
export function fixMediaUrlsInObject<T>(obj: T): T {
  if (!obj) return obj;

  // Handle strings
  if (typeof obj === 'string') {
    return fixMediaUrl(obj) as T;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => fixMediaUrlsInObject(item)) as T;
  }

  // Handle objects
  if (typeof obj === 'object' && obj !== null) {
    const fixed: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Fix common image-related property names
        if (
          key === 'url' ||
          key === 'src' ||
          key === 'image' ||
          key === 'backgroundImage' ||
          key === 'thumbnail' ||
          key === 'featured_image' ||
          key === 'imageUrl' ||
          key === 'logo'
        ) {
          fixed[key] = fixMediaUrl((obj as any)[key]);
        } else {
          fixed[key] = fixMediaUrlsInObject((obj as any)[key]);
        }
      }
    }
    return fixed;
  }

  return obj;
}

/**
 * Fix URLs in HTML content
 */
export function fixMediaUrlsInHtml(html: string): string {
  if (!html) return html;

  // Replace all instances of the external MinIO URL with proxy URLs
  return html.replace(
    /http:\/\/82\.29\.169\.180:9002\/media\/([^"'\s>]+)/g,
    '/api/media/$1'
  );
}