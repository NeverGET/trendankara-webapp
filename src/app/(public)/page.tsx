/**
 * Home page - Server component wrapper
 * Forces dynamic rendering
 */

import HomePageClient from './HomePageClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return <HomePageClient />;
}
