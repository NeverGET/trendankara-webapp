'use client';

import React from 'react';
import { useAudioPreview } from '@/hooks/useAudioPreview';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';

interface AudioPreviewPlayerProps {
  /** Stream URL to preview */
  streamUrl?: string;
  /** CSS class for styling */
  className?: string;
  /** Callback when preview starts */
  onPreviewStart?: () => void;
  /** Callback when preview stops */
  onPreviewStop?: () => void;
  /** Show compact version for smaller spaces */
  compact?: boolean;
}

/**
 * Audio preview player component for admin radio stream settings
 * Provides independent audio preview interface separate from main radio player
 *
 * Features:
 * - Play/pause/stop controls using Button component
 * - Volume slider with visual feedback
 * - Loading states with LoadingSpinner integration
 * - Error display with Turkish messages
 * - Independent from main radio player functionality
 */
export function AudioPreviewPlayer({
  streamUrl,
  className,
  onPreviewStart,
  onPreviewStop,
  compact = false
}: AudioPreviewPlayerProps) {
  const {
    isPlaying,
    isLoading,
    currentUrl,
    error,
    volume,
    currentTime,
    duration,
    play,
    pause,
    stop,
    setVolume
  } = useAudioPreview();

  // Handle play/pause toggle
  const handlePlayPause = async () => {
    if (!streamUrl) return;

    if (isPlaying) {
      pause();
      onPreviewStop?.();
    } else {
      try {
        await play(streamUrl);
        onPreviewStart?.();
      } catch (error) {
        console.error('Preview play error:', error);
      }
    }
  };

  // Handle stop button
  const handleStop = () => {
    stop();
    onPreviewStop?.();
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  // Format time display (for streams that support it)
  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status display text
  const getStatusDisplay = () => {
    if (isLoading) return 'Yükleniyor...';
    if (error) return 'Önizleme başlatılamadı'; // Requirement 3.7: Turkish error message
    if (isPlaying) return 'Önizleme oynatılıyor';
    if (currentUrl) return 'Önizleme duraklatıldı';
    return 'Önizleme hazır';
  };

  // Get status color
  const getStatusColor = () => {
    if (isLoading) return 'text-yellow-400';
    if (error) return 'text-red-400';
    if (isPlaying) return 'text-green-400';
    return 'text-dark-text-secondary';
  };

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-2 p-2 bg-dark-surface-secondary rounded-lg border border-dark-border-primary',
        className
      )}>
        {/* Compact Play/Pause Button */}
        <Button
          onClick={handlePlayPause}
          variant="default"
          size="sm"
          disabled={!streamUrl || isLoading}
          className="min-w-[36px] h-9 w-9 p-0 rounded-full"
          aria-label={isPlaying ? 'Önizlemeyi duraklat' : 'Önizlemeyi başlat'}
        >
          {isLoading ? (
            <LoadingSpinner size="small" hideText />
          ) : isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </Button>

        {/* Compact Status */}
        <div className="flex-1 min-w-0">
          <p className={cn('text-xs truncate', getStatusColor())}>
            {getStatusDisplay()}
          </p>
        </div>

        {/* Compact Volume */}
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3 text-dark-text-secondary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-12 h-1 bg-dark-surface-primary rounded-lg appearance-none cursor-pointer preview-slider"
            aria-label="Önizleme ses seviyesi"
          />
        </div>

        <style jsx>{`
          .preview-slider::-webkit-slider-thumb {
            appearance: none;
            width: 8px;
            height: 8px;
            background: #dc2626;
            border-radius: 50%;
            cursor: pointer;
          }
          .preview-slider::-moz-range-thumb {
            width: 8px;
            height: 8px;
            background: #dc2626;
            border-radius: 50%;
            cursor: pointer;
            border: none;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex flex-col gap-3 p-4 bg-dark-surface-secondary rounded-lg border border-dark-border-primary',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-dark-text-primary">
          Akış Önizlemesi
        </h3>
        {currentUrl && (
          <Button
            onClick={handleStop}
            variant="ghost"
            size="sm"
            className="text-dark-text-secondary hover:text-dark-text-primary"
          >
            Durdur
          </Button>
        )}
      </div>

      {/* Main Controls */}
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <Button
          onClick={handlePlayPause}
          variant="default"
          size="default"
          disabled={!streamUrl || isLoading}
          className="min-w-[44px] h-11 w-11 md:min-w-[48px] md:h-12 md:w-12 p-0 rounded-full"
          aria-label={isPlaying ? 'Önizlemeyi duraklat' : 'Önizlemeyi başlat'}
        >
          {isLoading ? (
            <LoadingSpinner size="small" hideText />
          ) : isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </Button>

        {/* Status and Time */}
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium truncate', getStatusColor())}>
            {getStatusDisplay()}
          </p>
          {isPlaying && (currentTime || duration) && (
            <p className="text-xs text-dark-text-secondary">
              {formatTime(currentTime || 0)} {duration && `/ ${formatTime(duration)}`}
            </p>
          )}
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-dark-text-secondary"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 md:w-20 h-1 bg-dark-surface-primary rounded-lg appearance-none cursor-pointer preview-slider"
            aria-label="Önizleme ses seviyesi"
          />
          <span className="text-xs text-dark-text-secondary w-8 text-right">
            {Math.round((volume || 1) * 100)}%
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-900/20 border border-red-800/50 rounded text-red-400 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Stream URL Info */}
      {streamUrl && (
        <div className="text-xs text-dark-text-secondary truncate">
          <span className="text-dark-text-tertiary">URL: </span>
          {streamUrl}
        </div>
      )}

      <style jsx>{`
        .preview-slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: #dc2626;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .preview-slider::-webkit-slider-thumb:hover {
          background: #b91c1c;
          transform: scale(1.1);
        }
        .preview-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #dc2626;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }
        .preview-slider::-moz-range-thumb:hover {
          background: #b91c1c;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}