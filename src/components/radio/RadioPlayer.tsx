'use client';

import React from 'react';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';

interface RadioPlayerProps {
  className?: string;
  variant?: 'desktop' | 'mobile';
}

export function RadioPlayer({ className, variant = 'desktop' }: RadioPlayerProps) {
  const {
    isPlaying,
    isLoading,
    volume,
    currentSong,
    connectionStatus,
    play,
    pause,
    setVolume
  } = useRadioPlayer();

  const handlePlayPause = async () => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  if (variant === 'mobile') {
    return (
      <div className={cn(
        'flex items-center gap-3 px-4 py-2 bg-dark-surface-primary',
        className
      )}>
        <Button
          onClick={handlePlayPause}
          variant="primary"
          size="medium"
          className="min-w-[48px] h-12 w-12 p-0 rounded-full"
          aria-label={isPlaying ? 'Duraklat' : 'Oynat'}
        >
          {isLoading ? (
            <LoadingSpinner size="small" text="" />
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

        <div className="flex-1 min-w-0">
          <p className="text-sm text-dark-text-primary truncate">
            {currentSong}
          </p>
          <p className="text-xs text-dark-text-tertiary">
            {connectionStatus === 'connected' ? 'Canlı Yayın' :
             connectionStatus === 'connecting' ? 'Bağlanıyor...' : 'Çevrimdışı'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-4 px-6 py-3 bg-dark-surface-primary rounded-lg',
      className
    )}>
      {/* Play/Pause Button */}
      <Button
        onClick={handlePlayPause}
        variant="primary"
        size="large"
        className="min-w-[60px] h-[60px] w-[60px] p-0 rounded-full"
        aria-label={isPlaying ? 'Radyoyu duraklat' : 'Radyoyu başlat'}
      >
        {isLoading ? (
          <LoadingSpinner size="small" text="" />
        ) : isPlaying ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </Button>

      {/* Song Info */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-dark-text-primary truncate">
          {currentSong}
        </p>
        <p className="text-sm text-dark-text-secondary">
          {connectionStatus === 'connected' ? 'Canlı Yayın' :
           connectionStatus === 'connecting' ? 'Bağlanıyor...' : 'Çevrimdışı'}
        </p>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5 text-dark-text-secondary"
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
          className="w-24 h-1 bg-dark-surface-secondary rounded-lg appearance-none cursor-pointer slider"
          aria-label="Ses seviyesi"
        />
        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            background: #dc2626;
            border-radius: 50%;
            cursor: pointer;
          }
          .slider::-moz-range-thumb {
            width: 12px;
            height: 12px;
            background: #dc2626;
            border-radius: 50%;
            cursor: pointer;
            border: none;
          }
        `}</style>
      </div>
    </div>
  );
}