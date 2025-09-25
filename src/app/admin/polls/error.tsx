'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error Boundary for Admin Polls Page
 *
 * Provides a user-friendly error display when the polls page encounters errors
 * Features:
 * - Friendly error message
 * - Retry action button
 * - Navigation back to admin home
 * - Error logging for debugging
 * - Dark theme compatible design
 */
export default function PollsErrorPage({ error, reset }: ErrorPageProps) {
  // Log error for debugging
  React.useEffect(() => {
    console.error('Polls page error:', error);
  }, [error]);

  const handleRetry = () => {
    // Reset the error boundary and retry
    reset();
  };

  const handleGoHome = () => {
    // Navigate to admin home
    window.location.href = '/admin';
  };

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Error Card */}
        <div className="bg-gradient-to-br from-dark-surface-primary to-dark-surface-secondary/50 rounded-xl border border-dark-border-primary/50 p-8 text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-red-600/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-dark-text-primary mb-4">
            Bir Hata Oluştu
          </h1>

          {/* Error Description */}
          <p className="text-dark-text-secondary mb-6 leading-relaxed">
            Anket sayfası yüklenirken beklenmeyen bir hata oluştu.
            Sayfayı yenilemeyi deneyin veya ana sayfaya geri dönün.
          </p>

          {/* Development Error Details */}
          {isDevelopment && (
            <div className="mb-6 p-4 bg-dark-surface-secondary rounded-lg text-left">
              <div className="flex items-center gap-2 mb-2">
                <Bug className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-500">Geliştirici Bilgisi</span>
              </div>
              <div className="text-xs text-dark-text-tertiary space-y-1">
                <div><strong>Hata:</strong> {error.message}</div>
                {error.digest && <div><strong>Digest:</strong> {error.digest}</div>}
                {error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-yellow-400 hover:text-yellow-300">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-32 bg-dark-bg-primary p-2 rounded border">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleRetry}
              variant="default"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tekrar Dene
            </Button>
            <Button
              onClick={handleGoHome}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Ana Sayfaya Dön
            </Button>
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-6 text-center">
          <p className="text-sm text-dark-text-tertiary">
            Sorun devam ederse, lütfen sistem yöneticisi ile iletişime geçin.
          </p>
        </div>
      </div>
    </div>
  );
}