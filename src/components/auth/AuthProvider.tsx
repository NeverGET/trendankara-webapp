'use client';

/**
 * Auth provider component for client-side session management
 * SIMPLE wrapper around NextAuth SessionProvider
 */

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component
 * Wraps the app with NextAuth SessionProvider
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider
      // Refetch session every 5 minutes
      refetchInterval={5 * 60}
      // Refetch session when window regains focus
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}