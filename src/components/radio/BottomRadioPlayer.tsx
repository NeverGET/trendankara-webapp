'use client';

import React from 'react';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { PlayerControls } from './PlayerControls';
import { cn } from '@/lib/utils';

interface BottomRadioPlayerProps {
  className?: string;
}

export function BottomRadioPlayer({ className }: BottomRadioPlayerProps) {
  const { currentSong, volume, setVolume, isPlaying } = useRadioPlayer();

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-30',
      'h-20 bg-dark-bg-primary border-t border-dark-border-primary',
      'backdrop-blur-lg bg-opacity-95',
      'md:hidden', // Only show on mobile
      className
    )}>
      <div className="container mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full gap-3">
          {/* Play Controls */}
          <PlayerControls size="medium" showConnectionStatus={false} />

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dark-text-primary truncate">
              {currentSong}
            </p>
            <p className="text-xs text-brand-red-600">
              {isPlaying ? 'Canlı Yayın' : 'Duraklatıldı'}
            </p>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setVolume(Math.max(0, volume - 0.1))}
              className="p-2 text-dark-text-secondary hover:text-dark-text-primary transition-colors"
              aria-label="Sesi azalt"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3z"/>
              </svg>
            </button>
            <button
              onClick={() => setVolume(Math.min(1, volume + 0.1))}
              className="p-2 text-dark-text-secondary hover:text-dark-text-primary transition-colors"
              aria-label="Sesi artır"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}