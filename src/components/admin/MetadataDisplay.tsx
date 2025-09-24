import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StreamMetadata } from '@/types/radioSettings';
import { cn } from '@/lib/utils';

interface MetadataDisplayProps {
  metadata?: StreamMetadata;
  className?: string;
  loading?: boolean;
  /** Stream URL for real-time metadata updates */
  streamUrl?: string;
  /** Whether preview is currently active (enables real-time updates) */
  isPreviewActive?: boolean;
  /** Polling interval in milliseconds (default: 5000ms) */
  pollingInterval?: number;
  /** Callback when metadata updates */
  onMetadataUpdate?: (metadata: StreamMetadata | null) => void;
}

export function MetadataDisplay({
  metadata,
  className,
  loading = false,
  streamUrl,
  isPreviewActive = false,
  pollingInterval = 5000,
  onMetadataUpdate
}: MetadataDisplayProps) {
  // State for real-time metadata updates
  const [currentMetadata, setCurrentMetadata] = useState<StreamMetadata | undefined>(metadata);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Update current metadata when prop changes
  useEffect(() => {
    setCurrentMetadata(metadata);
  }, [metadata]);

  // Metadata polling function
  const fetchMetadata = useCallback(async () => {
    if (!streamUrl) return;

    try {
      setPollingError(null);

      const response = await fetch('/api/admin/settings/radio/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamUrl,
          timeout: 3000, // Shorter timeout for real-time updates
        }),
      });

      const data = await response.json();

      if (data.success && data.metadata) {
        setCurrentMetadata(data.metadata);
        setLastUpdate(new Date());
        onMetadataUpdate?.(data.metadata);
      } else {
        // Don't treat failed metadata fetch as error, just skip this update
        console.warn('Metadata update failed:', data.message);
      }
    } catch (error) {
      // Handle network errors gracefully without displaying to user
      console.warn('Metadata polling error:', error);
      setPollingError('Metadata güncellenemedi');
    }
  }, [streamUrl, onMetadataUpdate]);

  // Real-time metadata polling effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isPreviewActive && streamUrl && pollingInterval > 0) {
      setIsPolling(true);

      // Fetch immediately when preview starts
      fetchMetadata();

      // Set up polling interval
      intervalId = setInterval(fetchMetadata, pollingInterval);
    } else {
      setIsPolling(false);
      setPollingError(null);
    }

    // Cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (!isPreviewActive) {
        setIsPolling(false);
        setPollingError(null);
      }
    };
  }, [isPreviewActive, streamUrl, pollingInterval, fetchMetadata]);

  // Use current metadata or fallback to prop metadata
  const displayMetadata = currentMetadata || metadata;
  // Loading state
  if (loading) {
    return (
      <Card title="Stream Metadata" className={className}>
        <div className="animate-pulse space-y-4">
          <div className="space-y-2">
            <div className="w-24 h-4 bg-dark-surface-secondary rounded" />
            <div className="w-full h-6 bg-dark-surface-secondary rounded" />
          </div>
          <div className="space-y-2">
            <div className="w-20 h-4 bg-dark-surface-secondary rounded" />
            <div className="w-32 h-6 bg-dark-surface-secondary rounded" />
          </div>
          <div className="space-y-2">
            <div className="w-28 h-4 bg-dark-surface-secondary rounded" />
            <div className="w-40 h-6 bg-dark-surface-secondary rounded" />
          </div>
        </div>
      </Card>
    );
  }

  // No metadata available
  if (!displayMetadata || Object.keys(displayMetadata).length === 0) {
    return (
      <Card
        title={
          <div className="flex items-center justify-between">
            <span>Stream Metadata</span>
            {isPolling && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-dark-text-secondary">Canlı güncelleme</span>
              </div>
            )}
          </div>
        }
        className={className}
      >
        <div className="text-center py-8">
          <div className="text-dark-text-secondary mb-2">
            📡
          </div>
          <p className="text-dark-text-secondary">
            Metadata bilgisi mevcut değil
          </p>
          {pollingError && (
            <p className="text-xs text-orange-400 mt-2">
              {pollingError}
            </p>
          )}
        </div>
      </Card>
    );
  }

  const hasBasicInfo = displayMetadata.streamTitle || displayMetadata.bitrate || displayMetadata.audioFormat;
  const hasServerInfo = displayMetadata.serverInfo && (
    displayMetadata.serverInfo.software ||
    displayMetadata.serverInfo.version ||
    displayMetadata.serverInfo.description
  );
  const hasExtraInfo = displayMetadata.extra && (
    displayMetadata.extra.genre ||
    displayMetadata.extra.contentType ||
    displayMetadata.extra.sampleRate ||
    displayMetadata.extra.channels
  );

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <span>Stream Metadata</span>
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <span className="text-xs text-dark-text-secondary">
                Son güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
              </span>
            )}
            {isPolling && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-dark-text-secondary">Canlı güncelleme</span>
              </div>
            )}
            {pollingError && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full" />
                <span className="text-xs text-orange-400">Güncelleme hatası</span>
              </div>
            )}
          </div>
        </div>
      }
      className={cn(
        'transition-all duration-300',
        'bg-gradient-to-br from-dark-surface-primary to-dark-surface-secondary/30',
        isPolling && 'ring-1 ring-green-500/20',
        className
      )}
    >
      <div className="space-y-6">
        {/* Stream Information Section */}
        {hasBasicInfo && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-brand-red-500 rounded-full" />
              <h4 className="text-sm font-semibold text-dark-text-primary uppercase tracking-wider">
                Stream Bilgisi
              </h4>
            </div>

            <div className="grid gap-4">
              {displayMetadata.streamTitle && (
                <div className="space-y-1">
                  <label className="text-xs text-dark-text-secondary font-medium uppercase tracking-wider">
                    Mevcut İçerik
                  </label>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" size="sm" animated>
                      {isPolling ? 'Canlı' : 'Çalıyor'}
                    </Badge>
                    <p className="text-sm text-dark-text-primary font-medium">
                      {displayMetadata.streamTitle}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayMetadata.bitrate && (
                  <div className="space-y-1">
                    <label className="text-xs text-dark-text-secondary font-medium uppercase tracking-wider">
                      Bitrate
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-brand-red-500 text-lg">♪</span>
                      <p className="text-sm text-dark-text-primary font-medium">
                        {displayMetadata.bitrate} kbps
                      </p>
                    </div>
                  </div>
                )}

                {displayMetadata.audioFormat && (
                  <div className="space-y-1">
                    <label className="text-xs text-dark-text-secondary font-medium uppercase tracking-wider">
                      Audio Format
                    </label>
                    <div className="flex items-center gap-2">
                      <Badge variant="info" size="sm">
                        {displayMetadata.audioFormat}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Server Information Section */}
        {hasServerInfo && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <h4 className="text-sm font-semibold text-dark-text-primary uppercase tracking-wider">
                Server Bilgisi
              </h4>
            </div>

            <div className="grid gap-4">
              {displayMetadata.serverInfo?.software && (
                <div className="space-y-1">
                  <label className="text-xs text-dark-text-secondary font-medium uppercase tracking-wider">
                    Server Tipi
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500 text-lg">🖥️</span>
                    <p className="text-sm text-dark-text-primary font-medium">
                      {displayMetadata.serverInfo.software}
                    </p>
                    {displayMetadata.serverInfo.version && (
                      <Badge variant="purple" size="sm">
                        v{displayMetadata.serverInfo.version}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {displayMetadata.serverInfo?.description && (
                <div className="space-y-1">
                  <label className="text-xs text-dark-text-secondary font-medium uppercase tracking-wider">
                    Açıklama
                  </label>
                  <p className="text-sm text-dark-text-secondary">
                    {displayMetadata.serverInfo.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Technical Details Section */}
        {hasExtraInfo && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <h4 className="text-sm font-semibold text-dark-text-primary uppercase tracking-wider">
                Teknik Detaylar
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayMetadata.extra?.genre && (
                <div className="space-y-1">
                  <label className="text-xs text-dark-text-secondary font-medium uppercase tracking-wider">
                    Tür
                  </label>
                  <Badge variant="pink" size="sm">
                    {displayMetadata.extra.genre}
                  </Badge>
                </div>
              )}

              {displayMetadata.extra?.contentType && (
                <div className="space-y-1">
                  <label className="text-xs text-dark-text-secondary font-medium uppercase tracking-wider">
                    İçerik Tipi
                  </label>
                  <p className="text-sm text-dark-text-secondary font-mono">
                    {displayMetadata.extra.contentType}
                  </p>
                </div>
              )}

              {displayMetadata.extra?.sampleRate && (
                <div className="space-y-1">
                  <label className="text-xs text-dark-text-secondary font-medium uppercase tracking-wider">
                    Sample Rate
                  </label>
                  <p className="text-sm text-dark-text-primary">
                    {displayMetadata.extra.sampleRate} Hz
                  </p>
                </div>
              )}

              {displayMetadata.extra?.channels && (
                <div className="space-y-1">
                  <label className="text-xs text-dark-text-secondary font-medium uppercase tracking-wider">
                    Kanallar
                  </label>
                  <p className="text-sm text-dark-text-primary">
                    {displayMetadata.extra.channels} kanal
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state when no detailed metadata */}
        {!hasBasicInfo && !hasServerInfo && !hasExtraInfo && (
          <div className="text-center py-4">
            <p className="text-dark-text-secondary text-sm">
              Detaylı metadata bilgisi mevcut değil
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}