'use client';

import React from 'react';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { Button } from '@/components/ui/button';
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
    reconnectAttempts,
    lastError,
    play,
    pause,
    setVolume,
    resetPlayer,
    reloadConfiguration
  } = useRadioPlayer();

  const handlePlayPause = async () => {
    if (isPlaying) {
      pause();
    } else {
      try {
        await play();
      } catch (error) {
        console.error('Play error:', error);
        // If play fails after connection issues, try reloading configuration
        if (reconnectAttempts >= 3) {
          await reloadConfiguration();
        }
      }
    }
  };

  const handleReconnect = async () => {
    try {
      resetPlayer();
      // Wait a moment for reset to complete
      setTimeout(async () => {
        await reloadConfiguration();
        await play();
      }, 1000);
    } catch (error) {
      console.error('Reconnect error:', error);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  // Enhanced status display with connection timeout handling
  const getStatusDisplay = () => {
    if (connectionStatus === 'connected') {
      return 'Canlı Yayın';
    } else if (connectionStatus === 'connecting') {
      return isLoading ? 'Bağlanıyor...' : 'Yeniden bağlanılıyor...';
    } else if (connectionStatus === 'disconnected') {
      if (reconnectAttempts > 0) {
        return `Bağlantı sorunu (Deneme ${reconnectAttempts})`;
      }
      return lastError ? 'Bağlantı hatası' : 'Çevrimdışı';
    }
    return 'Çevrimdışı';
  };

  if (variant === 'mobile') {
    return (
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 md:py-2 bg-dark-surface-primary',
        className
      )}>
        <Button
          onClick={handlePlayPause}
          variant="default"
          size="default"
          className="min-w-[44px] h-11 w-11 md:min-w-[48px] md:h-12 md:w-12 p-0 rounded-full"
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
          <p className="text-sm md:text-base text-dark-text-primary truncate">
            {isPlaying ? currentSong : 'Radyo çalınmıyor'}
          </p>
          <p className={cn(
            'text-xs',
            connectionStatus === 'connected' ? 'text-green-400' :
            connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'
          )}>
            {getStatusDisplay()}
          </p>
        </div>

        {/* Reconnect button for mobile when needed */}
        {connectionStatus === 'disconnected' && reconnectAttempts >= 3 && (
          <Button
            onClick={handleReconnect}
            variant="secondary"
            size="sm"
            className="text-xs"
          >
            Yeniden Bağlan
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 bg-dark-surface-primary rounded-lg',
      className
    )}>
      {/* Play/Pause Button */}
      <Button
        onClick={handlePlayPause}
        variant="default"
        size="lg"
        className="min-w-[52px] h-[52px] w-[52px] md:min-w-[60px] md:h-[60px] md:w-[60px] p-0 rounded-full"
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
        <p className="text-sm md:text-base font-medium text-dark-text-primary truncate">
          {isPlaying ? currentSong : 'Radyo çalınmıyor'}
        </p>
        <div className="flex items-center gap-2">
          <p className={cn(
            'text-sm',
            connectionStatus === 'connected' ? 'text-green-400' :
            connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'
          )}>
            {getStatusDisplay()}
          </p>
          {connectionStatus === 'disconnected' && reconnectAttempts >= 3 && (
            <Button
              onClick={handleReconnect}
              variant="secondary"
              size="sm"
              className="text-xs ml-2"
            >
              Yeniden Bağlan
            </Button>
          )}
        </div>
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
          className="w-20 md:w-24 h-1 bg-rose-950 rounded-lg appearance-none cursor-pointer slider"
          aria-label="Ses seviyesi"
        />
        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 14px;
            height: 14px;
            background: #f43f5e;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s;
          }
          .slider::-webkit-slider-thumb:hover {
            background: #fb7185;
            transform: scale(1.2);
          }
          .slider::-moz-range-thumb {
            width: 14px;
            height: 14px;
            background: #f43f5e;
            border-radius: 50%;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
          }
          .slider::-moz-range-thumb:hover {
            background: #fb7185;
            transform: scale(1.2);
          }
          .slider::-webkit-slider-runnable-track {
            background: linear-gradient(to right, #f43f5e 0%, #f43f5e ${volume * 100}%, #881337 ${volume * 100}%, #881337 100%);
            border-radius: 0.25rem;
          }
          .slider::-moz-range-track {
            background: #881337;
            border-radius: 0.25rem;
          }
          .slider::-moz-range-progress {
            background: #f43f5e;
            border-radius: 0.25rem;
          }
        `}</style>
      </div>
    </div>
  );
}