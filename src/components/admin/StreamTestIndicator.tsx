import React from 'react';
import { cn } from '@/lib/utils';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import type { StreamTestResult, StreamMetadata } from '@/types/radioSettings';

interface StreamTestIndicatorProps {
  /** Test result data from stream validation */
  testResult?: StreamTestResult;
  /** Stream metadata if available */
  metadata?: StreamMetadata;
  /** Whether a test is currently in progress */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Loading message to display during testing */
  loadingMessage?: string;
}

export function StreamTestIndicator({
  testResult,
  metadata,
  isLoading = false,
  className,
  loadingMessage = 'Stream bağlantısı test ediliyor...'
}: StreamTestIndicatorProps) {
  // Loading state
  if (isLoading) {
    return (
      <Alert
        variant="info"
        className={cn(
          'transition-all duration-300 border-blue-500/30',
          'bg-gradient-to-br from-blue-900/10 to-dark-surface-secondary/50',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-dark-text-primary">
              {loadingMessage}
            </p>
            <p className="text-xs text-dark-text-secondary">
              Lütfen bekleyin, bağlantı kontrol ediliyor...
            </p>
          </div>
        </div>
      </Alert>
    );
  }

  // No test result available
  if (!testResult) {
    return null;
  }

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

  const { success, message, timestamp, details } = testResult;

  // Success state
  if (success) {
    return (
      <Alert
        variant="success"
        title="Stream Bağlantısı Başarılı"
        className={cn(
          'transition-all duration-300 border-green-500/30',
          'bg-gradient-to-br from-green-900/10 to-dark-surface-secondary/50',
          className
        )}
      >
        <div className="space-y-4">
          {/* Success message */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-dark-text-primary font-medium">
              {message}
            </p>
            <Badge variant="success" size="small">
              Doğrulandı
            </Badge>
          </div>

          {/* Connection details */}
          {details && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                Bağlantı Detayları
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Response Time */}
                {details.responseTime && (
                  <div className="p-3 bg-dark-surface-secondary/50 rounded-lg border border-dark-border-primary/30">
                    <p className="text-xs text-dark-text-secondary font-medium mb-1">Yanıt Süresi</p>
                    <p className="text-sm font-semibold text-green-400">
                      {formatResponseTime(details.responseTime)}
                    </p>
                  </div>
                )}

                {/* Status Code */}
                {details.statusCode && (
                  <div className="p-3 bg-dark-surface-secondary/50 rounded-lg border border-dark-border-primary/30">
                    <p className="text-xs text-dark-text-secondary font-medium mb-1">HTTP Durumu</p>
                    <p className="text-sm font-semibold text-green-400">{details.statusCode}</p>
                  </div>
                )}

                {/* Content Type from metadata */}
                {metadata?.extra?.contentType && (
                  <div className="p-3 bg-dark-surface-secondary/50 rounded-lg border border-dark-border-primary/30">
                    <p className="text-xs text-dark-text-secondary font-medium mb-1">İçerik Tipi</p>
                    <p className="text-sm font-semibold text-dark-text-primary font-mono">
                      {metadata.extra.contentType}
                    </p>
                  </div>
                )}
              </div>

              {/* Server Information */}
              {metadata?.serverInfo && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-dark-text-secondary uppercase tracking-wider mb-2">
                    Server Bilgisi
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {metadata.serverInfo.software && (
                      <div className="p-3 bg-dark-surface-secondary/50 rounded-lg border border-dark-border-primary/30">
                        <p className="text-xs text-dark-text-secondary font-medium mb-1">Server Tipi</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-dark-text-primary">
                            {metadata.serverInfo.software}
                          </p>
                          {metadata.serverInfo.version && (
                            <Badge variant="info" size="small">
                              v{metadata.serverInfo.version}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {metadata.serverInfo.description && (
                      <div className="p-3 bg-dark-surface-secondary/50 rounded-lg border border-dark-border-primary/30">
                        <p className="text-xs text-dark-text-secondary font-medium mb-1">Server Açıklaması</p>
                        <p className="text-sm text-dark-text-primary">
                          {metadata.serverInfo.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stream Information */}
              {(metadata?.bitrate || metadata?.audioFormat) && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-dark-text-secondary uppercase tracking-wider mb-2">
                    Stream Özellikleri
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {metadata.bitrate && (
                      <div className="p-3 bg-dark-surface-secondary/50 rounded-lg border border-dark-border-primary/30">
                        <p className="text-xs text-dark-text-secondary font-medium mb-1">Bitrate</p>
                        <p className="text-sm font-semibold text-brand-red-400">
                          {metadata.bitrate} kbps
                        </p>
                      </div>
                    )}

                    {metadata.audioFormat && (
                      <div className="p-3 bg-dark-surface-secondary/50 rounded-lg border border-dark-border-primary/30">
                        <p className="text-xs text-dark-text-secondary font-medium mb-1">Audio Format</p>
                        <Badge variant="info" size="small">
                          {metadata.audioFormat}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className="pt-2 border-t border-dark-border-primary/30">
            <p className="text-xs text-dark-text-secondary">
              Test zamanı: {formatTimestamp(timestamp)}
            </p>
          </div>
        </div>
      </Alert>
    );
  }

  // Error state
  return (
    <Alert
      variant="error"
      title="Stream Bağlantısı Başarısız"
      className={cn(
        'transition-all duration-300 border-red-500/30',
        'bg-gradient-to-br from-red-900/10 to-dark-surface-secondary/50',
        className
      )}
    >
      <div className="space-y-4">
        {/* Error message */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-dark-text-primary font-medium">
            {message}
          </p>
          <Badge variant="error" size="small">
            Başarısız
          </Badge>
        </div>

        {/* Error details */}
        {details && (details.errorMessage || details.errorCode) && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
              Hata Detayları
            </h4>

            {details.errorMessage && (
              <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-300">
                  <span className="font-semibold">Hata Mesajı: </span>
                  {details.errorMessage}
                </p>
              </div>
            )}

            {details.errorCode && (
              <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-400">
                  <span className="font-semibold">Hata Kodu: </span>
                  {details.errorCode}
                </p>
              </div>
            )}

            {/* Response time for failed requests */}
            {details.responseTime && (
              <div className="p-3 bg-dark-surface-secondary/50 rounded-lg border border-dark-border-primary/30">
                <p className="text-xs text-dark-text-secondary font-medium mb-1">Yanıt Süresi</p>
                <p className="text-sm font-semibold text-red-400">
                  {formatResponseTime(details.responseTime)}
                </p>
              </div>
            )}

            {/* Status code for failed requests */}
            {details.statusCode && (
              <div className="p-3 bg-dark-surface-secondary/50 rounded-lg border border-dark-border-primary/30">
                <p className="text-xs text-dark-text-secondary font-medium mb-1">HTTP Durumu</p>
                <p className="text-sm font-semibold text-red-400">{details.statusCode}</p>
              </div>
            )}
          </div>
        )}

        {/* Common error scenarios */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
            Olası Çözümler
          </h4>
          <ul className="text-xs text-dark-text-secondary space-y-1 list-disc list-inside">
            <li>Stream URL&apos;sinin doğru olduğundan emin olun</li>
            <li>Stream sunucusunun aktif olduğunu kontrol edin</li>
            <li>Firewall veya ağ ayarlarını kontrol edin</li>
            <li>URL&apos;nin geçerli bir audio stream olduğunu doğrulayın</li>
          </ul>
        </div>

        {/* Timestamp */}
        <div className="pt-2 border-t border-dark-border-primary/30">
          <p className="text-xs text-dark-text-secondary">
            Test zamanı: {formatTimestamp(timestamp)}
          </p>
        </div>
      </div>
    </Alert>
  );
}