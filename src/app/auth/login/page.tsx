/**
 * Login page component
 * Server component wrapper that forces dynamic rendering
 */

import { Suspense } from 'react';
import LoginFormClient from './LoginFormClient';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-dark-bg-primary">
        <div className="text-dark-text-primary">Yükleniyor...</div>
      </div>
    }>
      <LoginFormClient />
    </Suspense>
  );
}