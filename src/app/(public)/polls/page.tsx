/**
 * Polls page - Server component wrapper
 * Forces dynamic rendering
 */

import PollsPageClient from './PollsPageClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function PollsPage() {
  return <PollsPageClient />;
}
