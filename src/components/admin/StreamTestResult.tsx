import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { StreamTestResult as StreamTestResultType } from '@/types/radioSettings';

interface StreamTestResultProps {
  /** Test result data from stream validation */
  testResult: StreamTestResultType;
  /** Callback function for retry attempts */
  onRetry?: () => void;
  /** Loading state for retry operation */
  retryLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function StreamTestResult({
  testResult,
  onRetry,
  retryLoading = false,
  className
}: StreamTestResultProps) {
  const { success, message, timestamp, details } = testResult;

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('tr-TR', {
        dateStyle: 'short',
        timeStyle: 'medium'
      });
    } catch {
      return timestamp;
    }
  };

  // Format response time for display
  const formatResponseTime = (responseTime?: number) => {
    if (!responseTime) return null;
    return `${responseTime}ms`;
  };

  // Success/Error icons
  const statusIcon = success ? (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  );

  // Retry icon
  const retryIcon = (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
    </svg>
  );

  return (
    <Card
      className={cn(
        'transition-all duration-300',
        success
          ? 'border-green-500/30 bg-gradient-to-br from-green-900/10 to-dark-surface-secondary/50'
          : 'border-red-500/30 bg-gradient-to-br from-red-900/10 to-dark-surface-secondary/50',
        className
      )}
    >
      <div className="space-y-4">
        {/* Header with status badge and timestamp */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg shadow-lg',
              success
                ? 'bg-gradient-to-br from-green-600/20 to-green-700/10 text-green-400'
                : 'bg-gradient-to-br from-red-600/20 to-red-700/10 text-red-400'
            )}>
              {statusIcon}
            </div>
            <div>
              <Badge
                variant={success ? 'success' : 'error'}
                size="medium"
                pill
              >
                {success ? 'Başarılı' : 'Başarısız'}
              </Badge>
            </div>
          </div>
          <div className="text-xs text-dark-text-secondary">
            {formatTimestamp(timestamp)}
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <p className="text-sm text-dark-text-primary font-medium">
            {message}
          </p>

          {/* Error details for failed tests */}
          {!success && details?.errorMessage && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-300">
                <span className="font-semibold">Hata: </span>
                {details.errorMessage}
              </p>
              {details.errorCode && (
                <p className="text-xs text-red-400 mt-1">
                  <span className="font-semibold">Kod: </span>
                  {details.errorCode}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Connection details for successful tests */}
        {success && details && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
              Bağlantı Detayları
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {details.statusCode && (
                <div className="p-3 bg-dark-surface-secondary/50 rounded-lg border border-dark-border-primary/30">
                  <p className="text-xs text-dark-text-secondary font-medium mb-1">Durum Kodu</p>
                  <p className="text-sm font-semibold text-green-400">{details.statusCode}</p>
                </div>
              )}

              {details.responseTime && (
                <div className="p-3 bg-dark-surface-secondary/50 rounded-lg border border-dark-border-primary/30">
                  <p className="text-xs text-dark-text-secondary font-medium mb-1">Yanıt Süresi</p>
                  <p className="text-sm font-semibold text-dark-text-primary">
                    {formatResponseTime(details.responseTime)}
                  </p>
                </div>
              )}

              {/* Additional technical details can be shown here based on metadata */}
              <div className="p-3 bg-dark-surface-secondary/50 rounded-lg border border-dark-border-primary/30">
                <p className="text-xs text-dark-text-secondary font-medium mb-1">Test Sonucu</p>
                <p className="text-sm font-semibold text-brand-red-400">Doğrulandı</p>
              </div>
            </div>
          </div>
        )}

        {/* Retry button for failed tests */}
        {!success && onRetry && (
          <div className="flex justify-end pt-2 border-t border-dark-border-primary/30">
            <Button
              variant="secondary"
              size="small"
              onClick={onRetry}
              loading={retryLoading}
              icon={!retryLoading ? retryIcon : undefined}
              className="text-sm"
            >
              Tekrar Dene
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}