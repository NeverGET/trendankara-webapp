/**
 * News page - Server component wrapper
 * Forces dynamic rendering to avoid static generation issues
 */

import NewsPageClient from './NewsPageClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function NewsPage() {
  return <NewsPageClient />;
}