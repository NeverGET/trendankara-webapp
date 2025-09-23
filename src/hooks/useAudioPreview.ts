'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AudioPreviewState } from '@/types/radioSettings';

interface UseAudioPreviewReturn extends AudioPreviewState {
  // Control functions
  play: (url: string) => Promise<void>;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;

  // iOS specific
  isIOS: boolean;
}

/**
 * Independent audio preview hook for stream testing
 * Operates separately from the main radio player to avoid interference
 * Follows the same patterns as useRadioPlayer but with isolated state
 */
export function useAudioPreview(): UseAudioPreviewReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State management following AudioPreviewState interface
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(0.7); // Default volume
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // iOS detection (same pattern as main radio player)
  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Initialize audio element with cleanup
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio();
    audio.preload = 'none';
    audio.crossOrigin = 'anonymous';
    audio.volume = volume;
    audioRef.current = audio;

    // Audio event handlers
    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    const handleError = (e: Event) => {
      console.error('Audio preview error:', e);
      setError('Failed to load audio stream');
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setError(null);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      if (audio.currentTime) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    // Attach event listeners
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    // Cleanup function
    return () => {
      // Clear any pending timeouts
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }

      // Remove event listeners
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);

      // Stop and clean up audio
      audio.pause();
      audio.src = '';
      audio.load();
    };
  }, [volume]);

  // Play function with iOS cache-busting (following main radio player pattern)
  const play = useCallback(async (url: string) => {
    if (!audioRef.current) return;

    try {
      setIsLoading(true);
      setError(null);
      setCurrentUrl(url);

      // iOS needs cache-busting to prevent stale streams (same pattern as main player)
      const finalUrl = isIOS
        ? `${url}?t=${Date.now()}&r=${Math.random().toString(36).substring(7)}`
        : url;

      audioRef.current.src = finalUrl;
      audioRef.current.load();

      // Start playing within 3 seconds requirement (3.2)
      await audioRef.current.play();
    } catch (error) {
      console.error('Preview play error:', error);
      setError('Failed to start audio preview');
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, [isIOS]);

  // Pause function
  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  // Stop function (pause + reset)
  const stop = useCallback(() => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentUrl(null);
    setError(null);
  }, []);

  // Volume control (following main radio player pattern)
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  // Automatic cleanup on component unmount
  useEffect(() => {
    return () => {
      // Schedule cleanup after component unmounts
      cleanupTimeoutRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
          audioRef.current = null;
        }
      }, 100);
    };
  }, []);

  // Return state and control functions
  return {
    // State from AudioPreviewState interface
    isPlaying,
    isLoading,
    currentUrl,
    error,
    volume,
    currentTime,
    duration,

    // Control functions
    play,
    pause,
    stop,
    setVolume,

    // iOS detection
    isIOS
  };
}