'use client';

import React from 'react';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface PlayerControlsProps {
  size?: 'small' | 'medium' | 'large';
  showConnectionStatus?: boolean;
}

export function PlayerControls({
  size = 'medium',
  showConnectionStatus = true
}: PlayerControlsProps) {
  const {
    isPlaying,
    isLoading,
    connectionStatus,
    play,
    pause
  } = useRadioPlayer();

  const handleToggle = async () => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  };

  const buttonSizes = {
    small: 'sm' as const,
    medium: 'default' as const,
    large: 'lg' as const
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleToggle}
        variant="default"
        size={buttonSizes[size]}
        disabled={isLoading && !isPlaying}
        aria-label={isPlaying ? 'Duraklat' : 'Oynat'}
      >
        {isLoading && !isPlaying ? (
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

      {showConnectionStatus && (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            connectionStatus === 'connected' ? 'bg-green-500' :
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-dark-text-secondary">
            {connectionStatus === 'connected' ? 'Bağlı' :
             connectionStatus === 'connecting' ? 'Bağlanıyor' : 'Çevrimdışı'}
          </span>
        </div>
      )}
    </div>
  );
}